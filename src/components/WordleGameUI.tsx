import { Link } from "react-router-dom";
import "./WordleGameUI.css";
import { useEffect, useState } from "react";
import wordBank from "../data/wordle_words.json";

type TileState = "empty" | "filled" | "correct" | "present" | "absent";

type Tile = { letter: string; status: TileState };
type WordleApiResponse = { solution?: string };

const ROW_COUNT = 6;
const COL_COUNT = 5;
const WORD_BANK_SET = new Set((wordBank as string[]).map((word) => word.toLowerCase()));
const WORD_API_BASE =
  import.meta.env.VITE_WORD_API_BASE?.replace(/\/$/, "") ?? "http://3.15.180.103:3001";

/** Static demo row to show evaluated tile colors; remainder are empty placeholders. */

const KEYBOARD_ROWS: { keys: string; wide?: "enter" | "back" }[][] = [
  [
    { keys: "Q" },
    { keys: "W" },
    { keys: "E" },
    { keys: "R" },
    { keys: "T" },
    { keys: "Y" },
    { keys: "U" },
    { keys: "I" },
    { keys: "O" },
    { keys: "P" },
  ],
  [
    { keys: "A" },
    { keys: "S" },
    { keys: "D" },
    { keys: "F" },
    { keys: "G" },
    { keys: "H" },
    { keys: "J" },
    { keys: "K" },
    { keys: "L" },
  ],
  [
    { keys: "ENTER", wide: "enter" },
    { keys: "Z" },
    { keys: "X" },
    { keys: "C" },
    { keys: "V" },
    { keys: "B" },
    { keys: "N" },
    { keys: "M" },
    { keys: "⌫", wide: "back" },
  ],
];

type KeyCapState = "default" | "correct" | "present" | "absent";

/** Matches first demo row so key colors mirror the board preview. */
const KEYBOARD_LETTER_STATES: Record<string, KeyCapState> = {
  W: "correct",
  E: "present",
  A: "absent",
  R: "absent",
  Y: "correct",
};

function tileClass(state: TileState): string {
  const base = "guess-grid-square";
  switch (state) {
    case "empty":
      return `${base} border-[#3a3a3c] bg-transparent text-white`;
    case "filled":
      return `${base} border-[#3a3a3c] bg-transparent text-white`;
    case "correct":
      return `${base} border-[#538d4e] bg-[#538d4e] text-white`;
    case "present":
      return `${base} border-[#b59f3b] bg-[#b59f3b] text-white`;
    case "absent":
      return `${base} border-[#3a3a3c] bg-[#3a3a3c] text-white`;
    default:
      return base;
  }
}

function keyCapClass(state: KeyCapState): string {
  const base =
    "flex cursor-default select-none items-center justify-center rounded font-bold uppercase text-[#d7dadc] shadow-sm";
  switch (state) {
    case "correct":
      return `${base} bg-[#538d4e]`;
    case "present":
      return `${base} bg-[#b59f3b]`;
    case "absent":
      return `${base} bg-[#3a3a3c]`;
    default:
      return `${base} bg-[#818384]`;
  }
}

function evaluateGuess(guess: string, answer: string): TileState[] {
  const result: TileState[] = Array.from({ length: COL_COUNT }, () => "absent");
  const answerChars = answer.split("");
  const guessChars = guess.split("");

  for (let i = 0; i < COL_COUNT; i += 1) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = "correct";
      answerChars[i] = "_";
    }
  }

  for (let i = 0; i < COL_COUNT; i += 1) {
    if (result[i] === "correct") continue;
    const presentAt = answerChars.indexOf(guessChars[i]);
    if (presentAt !== -1) {
      result[i] = "present";
      answerChars[presentAt] = "_";
    }
  }

  return result;
}

function WordleGameUI() {
  const [gameGrid, setGameGrid] = useState<Tile[]>(() =>
    Array.from({ length: ROW_COUNT * COL_COUNT }, () => ({
      letter: "",
      status: "empty" as TileState,
    })),
  );
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [answer, setAnswer] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  const fetchWord = async (): Promise<WordleApiResponse> => {
    const res = await fetch(`${WORD_API_BASE}/word`);
    if (!res.ok) {
      throw new Error(`Failed to fetch /word: ${res.status}`);
    }
    const data = (await res.json()) as WordleApiResponse;
    setAnswer((data.solution ?? "").toLowerCase());
    return data;
  };

  useEffect(() => {
    fetchWord().catch((error) => {
      setMessage("Could not load puzzle word");
      console.error(error);
    });
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeoutId = window.setTimeout(() => setMessage(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  const setLetter = (letter: string) => {
    if (gameOver) return;
    if (currentCol >= COL_COUNT || currentRow >= ROW_COUNT) return;

    const index = currentRow * COL_COUNT + currentCol;
    setGameGrid((prev) => {
      const next = [...prev];
      next[index] = { letter, status: "filled" };
      return next;
    });
    setCurrentCol((col) => col + 1);
  };

  const deleteLetter = () => {
    if (gameOver) return;
    if (currentCol === 0) return;

    const nextCol = currentCol - 1;
    const index = currentRow * COL_COUNT + nextCol;
    setGameGrid((prev) => {
      const next = [...prev];
      next[index] = { letter: "", status: "empty" };
      return next;
    });
    setCurrentCol(nextCol);
  };

  const submitGuess = () => {
    if (gameOver) return;
    if (currentCol < COL_COUNT) {
      setMessage("Not enough letters");
      return;
    }
    if (!answer) {
      setMessage("Puzzle not ready");
      return;
    }

    const rowStart = currentRow * COL_COUNT;
    const guess = gameGrid
      .slice(rowStart, rowStart + COL_COUNT)
      .map((tile) => tile.letter.toLowerCase())
      .join("");

    if (!WORD_BANK_SET.has(guess)) {
      setMessage("Not in word list");
      return;
    }

    const statuses = evaluateGuess(guess, answer);
    setGameGrid((prev) => {
      const next = [...prev];
      for (let i = 0; i < COL_COUNT; i += 1) {
        const tileIndex = rowStart + i;
        next[tileIndex] = { ...next[tileIndex], status: statuses[i] };
      }
      return next;
    });

    if (guess === answer) {
      setGameOver(true);
      setMessage("You win!");
      return;
    }

    if (currentRow === ROW_COUNT - 1) {
      setGameOver(true);
      setMessage(`Word was ${answer.toUpperCase()}`);
      return;
    }

    setCurrentRow((row) => row + 1);
    setCurrentCol(0);
  };

  const onInputKey = (key: string) => {
    if (key === "ENTER") {
      submitGuess();
      return;
    }
    if (key === "⌫") {
      deleteLetter();
      return;
    }
    if (/^[A-Z]$/.test(key)) {
      setLetter(key);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        deleteLetter();
        return;
      }
      if (e.key === "Enter") {
        submitGuess();
        return;
      }
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        onInputKey(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentCol, currentRow, answer, gameGrid, gameOver]);

  return (
    <div className="h-[100vh] w-[100vw] grid grid-rows-[50px_1fr] bg-[#121213] text-[#d7dadc]">
      {/* Nav */}
      <header className="flex flex-row justify-between items-center p-4">
        <Link to="/" className="">
          Home
        </Link>
        <h1 className="">WORDLE</h1>
        <div>yo</div>
      </header>

      <div className="flex w-full flex-col items-center">
        {message ? (
          <div className="mb-4 rounded bg-[#3a3a3c] px-3 py-1 text-sm font-semibold text-white">
            {message}
          </div>
        ) : null}
        {/* Game grid */}
        <div className="grid grid-rows-6 grid-cols-5 gap-1 mt-30">
          {gameGrid.map((_, index) => {
            return (
              <div
                className={`${tileClass(gameGrid[index].status)}`}
                key={index}
              >
                {gameGrid[index].letter}
              </div>
            );
          })}
        </div>
        {/* Keyboard */}
        <div
          className="mt-auto flex w-full max-w-[500px] flex-col gap-2 px-1 mb-40"
          aria-label="On-screen keyboard (inactive)"
        >
          {KEYBOARD_ROWS.map((row, ri) => (
            <div
              key={ri}
              className="flex w-full justify-center gap-[6px] sm:gap-1.5"
            >
              {row.map((key) => {
                const label = key.keys;
                const wide = Boolean(key.wide);
                const letterState =
                  label.length === 1
                    ? (KEYBOARD_LETTER_STATES[label] ?? "default")
                    : "default";
                return (
                  <button
                    key={label + ri}
                    type="button"
                    onClick={() => onInputKey(label)}
                    className={`${keyCapClass(letterState)} h-14 min-w-0 text-sm sm:h-[58px] ${
                      wide
                        ? "flex-[1.5] px-1 text-xs sm:flex-[1.2] sm:text-sm"
                        : "flex-1 text-base sm:text-lg"
                    } `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WordleGameUI;
