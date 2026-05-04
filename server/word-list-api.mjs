import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

function getNytWordleUrl(dateIso) {
  return `https://www.nytimes.com/svc/wordle/v2/${dateIso}.json`;
}

app.use(cors());

app.get("/word", async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch(getNytWordleUrl(today));

    if (!response.ok) {
      return res.status(502).json({
        error: "Failed to fetch NYT Wordle data",
        status: response.status,
      });
    }

    const puzzleData = await response.json();
    return res.json(puzzleData);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected error while fetching NYT Wordle data",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Word API server running at http://localhost:${PORT}`);
});