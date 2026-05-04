import express from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const COL_COUNT = 5;
const WORD_LIST_PATH = new URL("../src/data/wordle_words.json", import.meta.url);
let cachedWordListSet;
let cachedWordListDate;
let cachedSolution;
let cachedSolutionDate;

function getNytWordleUrl(dateIso) {
  return `https://www.nytimes.com/svc/wordle/v2/${dateIso}.json`;
}

app.use(cors());
app.use(express.json());

async function getWordBankSet() {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedWordListSet && cachedWordListDate === today) {
    return cachedWordListSet;
  }

  const rawList = await readFile(WORD_LIST_PATH, "utf-8");
  const parsedList = JSON.parse(rawList);
  cachedWordListSet = new Set(parsedList.map((word) => String(word).toLowerCase()));
  cachedWordListDate = today;
  return cachedWordListSet;
}

function evaluateGuess(guess, answer) {
  const result = Array.from({ length: COL_COUNT }, () => "absent");
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

async function getTodaySolution() {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedSolution && cachedSolutionDate === today) {
    return cachedSolution;
  }

  const response = await fetch(getNytWordleUrl(today));
  if (!response.ok) {
    const error = new Error("Failed to fetch NYT Wordle data");
    error.status = response.status;
    throw error;
  }

  const puzzleData = await response.json();
  const solution = String(puzzleData.solution ?? "").toLowerCase();
  if (!solution || solution.length !== COL_COUNT) {
    throw new Error("NYT Wordle response did not include a valid solution");
  }

  cachedSolution = solution;
  cachedSolutionDate = today;
  return solution;
}

app.get("/word", async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    await getTodaySolution();
    return res.json({ date: today, ready: true });
  } catch (error) {
    return res.status(502).json({
      error: "Failed to fetch NYT Wordle data",
      status: error.status ?? 502,
    });
  }
});

app.post("/guess", async (req, res) => {
  try {
    const guess = String(req.body?.guess ?? "").toLowerCase().trim();
    if (!/^[a-z]{5}$/.test(guess)) {
      return res.status(400).json({
        error: "Guess must be a 5-letter alphabetic string",
      });
    }

    const [wordBank, answer] = await Promise.all([
      getWordBankSet(),
      getTodaySolution(),
    ]);

    if (!wordBank.has(guess)) {
      return res.json({ validWord: false });
    }

    const statuses = evaluateGuess(guess, answer);
    return res.json({
      validWord: true,
      statuses,
      isCorrect: guess === answer,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected error while evaluating guess",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Word API server running at http://localhost:${PORT}`);
});