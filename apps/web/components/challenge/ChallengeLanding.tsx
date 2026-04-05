"use client";

import { motion } from "framer-motion";
import type { Challenge } from "@/lib/types";

interface ChallengeLandingProps {
  challenge: Challenge;
  onAccept: () => void;
}

export default function ChallengeLanding({ challenge, onAccept }: ChallengeLandingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-5 max-w-[420px] mx-auto text-center"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
        className="text-7xl mb-4"
      >
        🏆
      </motion.span>

      <h2 className="font-display text-2xl font-800 text-foreground mb-2">You've Been Challenged!</h2>
      <p className="text-muted-foreground text-sm mb-8">
        <span className="text-foreground font-700">{challenge.creator_name}</span> scored{" "}
        <span className="text-primary font-700">{challenge.creator_score}%</span> on this quiz.
        <br />Can you beat them?
      </p>

      <div className="flex gap-3 w-full mb-8">
        <div className="flex-1 bg-card rounded-2xl p-4">
          <span className="text-xl">📚</span>
          <p className="font-display text-sm font-700 text-foreground mt-1">{challenge.topic}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Topic</p>
        </div>
        <div className="flex-1 bg-card rounded-2xl p-4">
          <span className="text-xl">📊</span>
          <p className="font-display text-sm font-700 text-foreground mt-1 capitalize">{challenge.difficulty}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Difficulty</p>
        </div>
        <div className="flex-1 bg-card rounded-2xl p-4">
          <span className="text-xl">❓</span>
          <p className="font-display text-sm font-700 text-foreground mt-1">{challenge.question_count}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Questions</p>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onAccept}
        className="w-full py-4 rounded-2xl gradient-teal text-primary-foreground font-display font-700 text-base shadow-lg"
      >
        Accept Challenge
      </motion.button>
    </motion.div>
  );
}
