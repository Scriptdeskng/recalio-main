"use client";

import { AnimatePresence, motion } from "framer-motion";

interface QuizHeaderProps {
  topic: string;
  xp: number;
  xpFloat: boolean;
  onExitClick: () => void;
}

export default function QuizHeader({ topic, xp, xpFloat, onExitClick }: QuizHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExitClick}
          className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border"
        >
          ✕
        </button>
        <p className="font-display text-base font-700 text-foreground truncate max-w-[180px]">
          {topic}
        </p>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-dim/15 relative">
        <span className="text-sm">🔥</span>
        <span className="text-sm font-display font-700 text-primary">{xp} XP</span>
        <AnimatePresence>
          {xpFloat && (
            <motion.span
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -20 }}
              exit={{ opacity: 0 }}
              className="absolute -top-4 right-0 text-xs font-bold text-primary"
            >
              +10
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
