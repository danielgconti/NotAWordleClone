import "./App.css";
import { Route, Routes } from "react-router-dom";
import WordleGameUI from "./components/WordleGameUI";

function NotFoundPage() {
  return (
    <main className="not-found">
      <h1>Page not found</h1>
      <p>The route you requested does not exist.</p>
    </main>
  );
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<WordleGameUI />} />
        <Route path="/play" element={<WordleGameUI />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
