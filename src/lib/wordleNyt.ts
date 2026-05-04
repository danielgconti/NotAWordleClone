/** NYT daily Wordle puzzle JSON (`/svc/wordle/v2/{YYYY-MM-DD}.json`). */
export type NytWordlePuzzle = {
  id: number;
  solution: string;
  print_date: string;
  days_since_launch: number;
  editor: string;
};

/** Calendar date of the live puzzle in US Eastern time (matches NYT’s day rollover). */
export function getWordleCalendarDateYmd(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Loads the official solution for the given calendar day.
 * Default URL is same-origin `/api/wordle/...` so Vite can proxy to nytimes.com (CORS).
 * Override with `VITE_WORDLE_PROXY_BASE` if you deploy behind your own proxy.
 */
export async function fetchDailySolution(
  dateYmd: string,
): Promise<NytWordlePuzzle> {
  const base =
    import.meta.env.VITE_WORDLE_PROXY_BASE?.replace(/\/$/, "") ??
    "/api/wordle";
  const url = `${base}/v2/${dateYmd}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load puzzle (${res.status})`);
  }
  const data = (await res.json()) as NytWordlePuzzle;
  if (!data.solution || data.solution.length !== 5) {
    throw new Error("Invalid puzzle response");
  }
  return data;
}
