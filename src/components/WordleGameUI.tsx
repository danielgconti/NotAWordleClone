import { Link } from "react-router-dom";
import "./WordleGameUI.css";
import { useEffect, useRef, useState } from "react";

type TileState = "empty" | "filled" | "correct" | "present" | "absent";

type Tile = { letter: string; state: TileState };

const ROW_COUNT = 6;
const COL_COUNT = 5;

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
  const base =
    "flex aspect-square max-h-[3.75rem] w-full max-w-[3.75rem] shrink-0 items-center justify-center border-2 text-[1.75rem] font-bold uppercase sm:text-[2rem]";
  switch (state) {
    case "empty":
      return `${base} border-[#3a3a3c] bg-transparent text-white`;
    case "filled":
      return `${base} border-[#565758] bg-transparent text-white`;
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

function WordleGameUI() {
  const [gameGrid, setGameGrid] = useState(() => Array(30).fill(""));
  const [curr, setCurr] = useState(0);
  const [guessNum, setGuessNum] = useState(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        /* ... */
        return;
      }
      if (e.key === "Enter") {
        console.log(curr);
        if (curr % 5 == 0) {
          setGuessNum((g) => {
            return guessNum + 1;
          });
        }
        return;
      }
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        const letter = e.key.toUpperCase();
        const rowEndExclusive = guessNum * COL_COUNT + COL_COUNT;
        setCurr((c) => {
          if (c >= rowEndExclusive) return c;
          setGameGrid((prev) => {
            const next = [...prev];
            next[c] = letter;
            return next;
          });
          return c + 1;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [curr, guessNum]);

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
        {/* Game grid */}
        <div className="grid grid-rows-6 grid-cols-5 gap-1 mt-30">
          {gameGrid.map((something, index) => {
            return (
              <div className="guess-grid-square" key={index}>
                {gameGrid[index]}
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
                    onClick={(e) => console.log(label)}
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
