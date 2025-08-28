import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { DRUGS } from "./drugs";
import ShareResults from "./ShareResults";

// --- Categories ---
const CATEGORIES = [
  { key: "therapeutic_class", label: "Therapeutic Class" },
  { key: "molecule_class", label: "Molecule Class" },
  { key: "route", label: "Route" },
  { key: "prescription", label: "Prescription" },
  { key: "mechanism", label: "Mechanism" },
  { key: "target_system", label: "Target System" },
];
const HINT_CATEGORIES = CATEGORIES.filter(c => c.key !== "prescription");

// --- Helpers ---
const normalize = v => (v == null ? "" : String(v).trim().toLowerCase());
const pickRandom = list => list[Math.floor(Math.random() * list.length)];
const computeMatch = (target, categoryKey, value) =>
  normalize(target[categoryKey]) === normalize(value) ? "match" : "none";

// --- Daily drug selection ---
const getDailyDrug = () => {
  const startDate = new Date(2025, 0, 1); // arbitrary reference
  const today = new Date();
  const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  return DRUGS[diffDays % DRUGS.length];
};

const checkAchievements = (hasWon, hintsRevealed) => {
  const achievements = JSON.parse(localStorage.getItem("achievements") || "[]");
  if (hasWon && !achievements.includes("first_win")) achievements.push("first_win");
  if (hasWon && hintsRevealed.length === 0 && !achievements.includes("win_without_hints")) achievements.push("win_without_hints");
  localStorage.setItem("achievements", JSON.stringify(achievements));
  return achievements;
};


export default function App() {
  const cardRef = useRef(null);
  const inputRef = useRef(null);
  const [target, setTarget] = useState(getDailyDrug);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [error, setError] = useState("");
  const [hintsRevealed, setHintsRevealed] = useState([]);
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem("streak") || "0"));
  const [showShare, setShowShare] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const maxAttempts = 6;
  const [confettiDims, setConfettiDims] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const drugNames = useMemo(() => DRUGS.map(d => d.name), []);
  const hasWon = guesses.some(g => normalize(g.name) === normalize(target.name));
  const hasLost = guesses.length >= maxAttempts && !hasWon;

  const filteredSuggestions = drugNames.filter(
    n => normalize(n).startsWith(normalize(currentGuess)) && normalize(n) !== normalize(currentGuess)
  );

  // --- Close suggestions when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Increment streak when won ---
  useEffect(() => {
    if (hasWon) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem("streak", newStreak.toString());
    }
  }, [hasWon]);

  const handleSubmit = e => {
    e?.preventDefault?.();
    setError("");
    const guessDrug = DRUGS.find(d => normalize(d.name) === normalize(currentGuess));
    if (!guessDrug) {
      setError("Unknown drug. Please pick from suggestions.");
      return;
    }
    setGuesses(prev => {
      if (prev.length && normalize(prev[prev.length - 1].name) === normalize(guessDrug.name)) return prev;
      return [...prev, guessDrug];
    });
    setCurrentGuess("");
    setShowSuggestions(false);
  };

  const resetGame = () => {
    setGuesses([]);
    setCurrentGuess("");
    setError("");
    setHintsRevealed([]);
  };

  const revealHint = () => {
    const remaining = HINT_CATEGORIES.filter(c => !hintsRevealed.includes(c.key));
    if (remaining.length === 0) return;
    const nextHint = pickRandom(remaining);
    setHintsRevealed([...hintsRevealed, nextHint.key]);
  };

  const cellVariants = { hidden: { rotateX: 90, opacity: 0 }, visible: { rotateX: 0, opacity: 1, transition: { duration: 0.3 } } };
  const rowVariants = { visible: { transition: { staggerChildren: 0.25 } } };
  const bannerVariants = { hidden: { y: -50, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300 } } };

  useEffect(() => {
    if (cardRef.current && hasWon) {
      const rect = cardRef.current.getBoundingClientRect();
      setConfettiDims({
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height
      });
    }
  }, [hasWon]);
  return (
    <div className="flex justify-center items-start min-h-screen bg-blue-50 p-6 relative">
      {/* Confetti on win */}
      {hasWon && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={300}
          recycle={false}
          gravity={0.3}
          run={hasWon}
          confettiSource={{
            x: confettiDims.x,
            y: confettiDims.y,
            w: confettiDims.w,
            h: confettiDims.h
          }}
        />
      )}

      <div ref={cardRef} className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-5xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-indigo-600">Druggle 💊</h1>
            <p className="text-gray-600 mt-1">Guess the drug by its classes. {maxAttempts} attempts max.</p>
          </div>
          <div className="text-right text-lg text-indigo-700 font-semibold">🔥 Streak: {streak}</div>
        </div>

        {/* Guesses Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm md:text-base">
            <thead>
              <tr className="bg-gray-100 sticky top-0">
                <th className="border px-3 py-2 text-left">Drug</th>
                {CATEGORIES.map(c => <th key={c.key} className="border px-3 py-2 text-left">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {guesses.map((g, idx) => (
                <motion.tr key={idx} variants={rowVariants} initial="hidden" animate="visible">
                  <td className="border px-3 py-2 font-medium">{g.name}</td>
                  {CATEGORIES.map(c => {
                    const match = computeMatch(target, c.key, g[c.key]);
                    const bg = match === "match" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-800";
                    return <motion.td key={c.key} className={`border px-3 py-2 text-center font-semibold rounded ${bg}`} variants={cellVariants}>{g[c.key]}</motion.td>;
                  })}
                </motion.tr>
              ))}
              {guesses.length === 0 && (
                <tr>
                  <td colSpan={1 + CATEGORIES.length} className="border px-3 py-6 text-center text-gray-500">Make your first guess!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Input & Controls */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-stretch relative">
          <div className="flex-1 relative" ref={inputRef}>
            <input
              type="text"
              value={currentGuess}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => { setCurrentGuess(e.target.value); setShowSuggestions(true); }}
              placeholder="Start typing a drug name…"
              className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 ${error ? "border-red-500" : "border-gray-300"}`}
              disabled={hasWon || hasLost}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul className="absolute bg-white border rounded-lg mt-1 max-h-32 overflow-auto shadow-lg z-50 w-full">
                {filteredSuggestions.map(n => (
                  <li
                    key={n}
                    className="px-3 py-1 hover:bg-indigo-100 cursor-pointer"
                    onClick={() => { setCurrentGuess(n); setShowSuggestions(false); }}
                  >
                    {n}
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button type="submit" className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50" disabled={hasWon || hasLost}>Guess</button>
            <button type="button" onClick={resetGame} className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition">Reset</button>
            <button type="button" onClick={revealHint} className="px-6 py-3 rounded-lg bg-yellow-200 text-yellow-800 hover:bg-yellow-300 transition" disabled={hintsRevealed.length >= HINT_CATEGORIES.length || hasWon || hasLost}>Hint</button>
          </div>

          {hintsRevealed.length > 0 && (
            <div className="mt-2 text-sm text-yellow-900">
              Hint: {hintsRevealed.map(key => `${CATEGORIES.find(c => c.key === key).label} → ${target[key]}`).join(", ")}
            </div>
          )}
        </form>

        {/* Win/Loss Banners */}
        <AnimatePresence>
          {hasWon && (
            <motion.div
              variants={{ hidden: { y: -50, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300 } } }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mt-4 p-4 bg-green-100 text-green-800 font-bold rounded-lg text-center text-lg shadow-md"
            >
              🎉 Correct! The drug was {target.name}.
            </motion.div>
          )}
          {hasLost && (
            <motion.div
              variants={{ hidden: { y: -50, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300 } } }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mt-4 p-4 bg-red-100 text-red-800 font-bold rounded-lg text-center text-lg shadow-md"
            >
              ❌ Game Over! The drug was {target.name}.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drug Summary */}
        <AnimatePresence>
          {hasWon && target.summary && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5 } }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-3 bg-indigo-50 border-l-4 border-indigo-400 text-indigo-700 rounded-md text-sm md:text-base shadow-sm"
            >
              {target.summary}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Achievements */}
<div className="mt-4 text-sm text-indigo-700">
  Achievements: {(() => {
    const achievements = JSON.parse(localStorage.getItem("achievements") || "[]");
    const ACHIEVEMENT_NAMES = {
      first_win: "First Win 🎉",
      win_without_hints: "Win Without Hints 🏆",
      // add more achievements with friendly names here
    };
    return achievements.length > 0
      ? achievements.map(a => ACHIEVEMENT_NAMES[a] || a).join(", ")
      : "None yet";
  })()}
</div>


        {/* Share Results */}
        <AnimatePresence>
          {showShare && (
            <ShareResults
              guesses={guesses}
              target={target}
              onClose={() => setShowShare(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
