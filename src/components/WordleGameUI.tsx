import { Link } from "react-router-dom";
import "./WordleGameUI.css";
import { useEffect, useState } from "react";

type TileState = "empty" | "filled" | "correct" | "present" | "absent";

type Tile = { letter: string; status: TileState };
type GuessApiResponse =
  | { validWord: false }
  | {
      validWord: true;
      statuses: Exclude<TileState, "empty" | "filled">[];
      isCorrect: boolean;
    };

const ROW_COUNT = 6;
const COL_COUNT = 5;
const WORD_API_BASE =
  import.meta.env.VITE_WORD_API_BASE?.replace(/\/$/, "") ??
  "http://3.15.180.103:3001";

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

function promoteKeyState(
  current: KeyCapState,
  next: Exclude<TileState, "empty" | "filled">,
): KeyCapState {
  const priority: Record<KeyCapState, number> = {
    default: 0,
    absent: 1,
    present: 2,
    correct: 3,
  };
  return priority[next] > priority[current] ? next : current;
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
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardLetterStates, setKeyboardLetterStates] = useState<
    Record<string, KeyCapState>
  >({});

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

  const submitGuess = async () => {
    if (gameOver || isSubmitting) return;
    if (currentCol < COL_COUNT) {
      setMessage("Not enough letters");
      return;
    }

    const rowStart = currentRow * COL_COUNT;
    const guess = gameGrid
      .slice(rowStart, rowStart + COL_COUNT)
      .map((tile) => tile.letter.toLowerCase())
      .join("");

    try {
      setIsSubmitting(true);
      const res = await fetch(`${WORD_API_BASE}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess }),
      });

      if (!res.ok) {
        throw new Error(`Failed to evaluate guess: ${res.status}`);
      }

      const data = (await res.json()) as GuessApiResponse;
      if (!data.validWord) {
        setMessage("Not in word list");
        return;
      }

      const statuses = data.statuses;
      setGameGrid((prev) => {
        const next = [...prev];
        for (let i = 0; i < COL_COUNT; i += 1) {
          const tileIndex = rowStart + i;
          next[tileIndex] = { ...next[tileIndex], status: statuses[i] };
        }
        return next;
      });

      setKeyboardLetterStates((prev) => {
        const next = { ...prev };
        for (let i = 0; i < COL_COUNT; i += 1) {
          const letter = guess[i].toUpperCase();
          next[letter] = promoteKeyState(next[letter] ?? "default", statuses[i]);
        }
        return next;
      });

      if (data.isCorrect) {
        setGameOver(true);
        setMessage("You win!");
        return;
      }

      if (currentRow === ROW_COUNT - 1) {
        setGameOver(true);
        setMessage("Out of guesses");
        return;
      }

      setCurrentRow((row) => row + 1);
      setCurrentCol(0);
    } catch (error) {
      setMessage("Could not validate guess");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInputKey = (key: string) => {
    if (key === "ENTER") {
      void submitGuess();
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
        void submitGuess();
        return;
      }
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        onInputKey(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentCol, currentRow, gameGrid, gameOver, isSubmitting]);

  return (
    <div className="h-[100vh] w-[100vw] grid grid-rows-[50px_1fr] bg-[#121213] text-[#d7dadc]">
      {/* Nav */}
      <header className="flex flex-row justify-between items-center p-4">
        <Link to="/" className=""></Link>
        <h1 className="">NOT WORDLE</h1>
        <div></div>
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
                    ? (keyboardLetterStates[label] ?? "default")
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
