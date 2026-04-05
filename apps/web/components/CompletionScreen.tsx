"use client";

import { motion } from "framer-motion";
import type { QuizResult } from "@/lib/types";
import { COMPLETION_TIERS, XP_PER_CORRECT } from "@/lib/constants";

interface CompletionScreenProps {
  results: QuizResult[];
  totalQuestions: number;
  xp: number;
  timeTaken?: number;
  onRetry: () => void;
  onNewTopic: () => void;
  onChallenge?: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CompletionScreen({ results, totalQuestions, xp, timeTaken, onRetry, onNewTopic, onChallenge }: CompletionScreenProps) {
  const correct = results.filter((r) => r.isCorrect).length;
  const wrong = totalQuestions - correct;
  const pct = Math.round((correct / totalQuestions) * 100);
  const maxXp = totalQuestions * XP_PER_CORRECT;

  const tier = COMPLETION_TIERS.find((t) => pct >= t.min) || COMPLETION_TIERS[COMPLETION_TIERS.length - 1];

  const stats = [
    { emoji: "✅", label: "Correct", value: `${correct}/${totalQuestions}` },
    { emoji: "⭐", label: "XP Earned", value: xp },
    ...(timeTaken !== undefined ? [{ emoji: "⏱️", label: "Time", value: formatTime(timeTaken) }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="min-h-screen flex flex-col items-center justify-center px-5 max-w-[420px] mx-auto text-center"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
        className="text-7xl mb-4"
      >
        {tier.emoji}
      </motion.span>

      <h2 className="font-display text-2xl font-800 text-foreground mb-2">{tier.title}</h2>
      <p className="text-muted-foreground text-sm mb-8">
        You scored {pct}% — {correct} of {totalQuestions} correct
      </p>

      {/* Stats */}
      <div className="flex gap-3 w-full mb-8">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 bg-card rounded-2xl p-4"
          >
            <span className="text-xl">{s.emoji}</span>
            <p className="font-display text-xl font-800 text-foreground mt-1">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* XP Bar */}
      <div className="w-full mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Score</span>
          <span>{xp}/{maxXp}</span>
        </div>
        <div className="h-3 rounded-full bg-card overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-teal"
            initial={{ width: 0 }}
            animate={{ width: `${(xp / maxXp) * 100}%` }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Buttons */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="w-full py-4 rounded-2xl gradient-teal text-primary-foreground font-display font-700 text-base shadow-lg mb-3"
      >
        Try Again
      </motion.button>

      {onChallenge && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            console.log("Challenge button clicked in CompletionScreen");
            onChallenge();
          }}
          className="w-full py-4 rounded-2xl border border-primary/30 text-foreground font-display font-700 text-base hover:bg-card transition-colors mb-3"
        >
          🏆 Challenge a Friend
        </motion.button>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNewTopic}
        className="w-full py-4 rounded-2xl border border-border text-foreground font-display font-600 text-base hover:bg-card transition-colors"
      >
        Back to Home
      </motion.button>
    </motion.div>
  );
}
