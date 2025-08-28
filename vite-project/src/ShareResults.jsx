import React, { useState } from "react";

// Function to calculate the daily Druggle number
const getDailyNumber = () => {
  const startDate = new Date(2025, 0, 1); // same reference as in App.jsx
  const today = new Date();
  const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 to start counting from 1
};

export default function ShareResults({ guesses, target, onClose }) {
  const [copied, setCopied] = useState(false);
  const dailyNumber = getDailyNumber();

  const generateShareString = () => {
    const grid = guesses
      .map((g) =>
        ["therapeutic_class", "molecule_class", "route", "mechanism", "target_system"]
          .map((cat) => (g[cat] === target[cat] ? "🟩" : "⬜"))
          .join("")
      )
      .join("\n");

    return `🎉 I won Druggle #${dailyNumber}!\n${grid}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateShareString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full flex flex-col gap-4">
        <h2 className="text-xl font-bold text-indigo-600">
          🎉 Congratulations! You've won today's Druggle #{dailyNumber}!
        </h2>
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
          {generateShareString()}
        </pre>
        <div className="flex justify-between items-center">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
