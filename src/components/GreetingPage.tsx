import { Link } from "react-router-dom";

const GreetingPage = () => {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[#121213] px-6 text-[#d7dadc]">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Not a Wordle clone</h1>
        <p className="mt-2 text-sm text-[#818384]">UI preview — game logic not wired yet.</p>
      </div>
      <Link
        to="/play"
        className="rounded border-2 border-[#3a3a3c] bg-[#121213] px-8 py-3 text-lg font-semibold tracking-wide transition-colors hover:bg-[#1a1a1b]"
      >
        Open game
      </Link>
    </main>
  );
};

export default GreetingPage;
