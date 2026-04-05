"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import type { Challenge } from "@/lib/types";
import ConfettiBurst from "@/components/ConfettiBurst";
import ShareCard from "./ShareCard";

interface ChallengeResultScreenProps {
  challenge: Challenge;
  challengerName: string;
  challengerScore: number;
  challengerTime: number;
  onRematch: () => void;
  onHome: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getOutcome(
  challengerScore: number,
  creatorScore: number,
  challengerTime: number,
  creatorTime: number
): "win" | "loss" | "tie" {
  if (challengerScore > creatorScore) return "win";
  if (challengerScore < creatorScore) return "loss";
  // Tie on score — faster time wins
  if (challengerTime < creatorTime) return "win";
  if (challengerTime > creatorTime) return "loss";
  return "tie";
}

export default function ChallengeResultScreen({
  challenge,
  challengerName,
  challengerScore,
  challengerTime,
  onRematch,
  onHome,
}: ChallengeResultScreenProps) {
  const outcome = getOutcome(challengerScore, challenge.creator_score, challengerTime, challenge.creator_time);
  const [showConfetti, setShowConfetti] = useState(outcome === "win");
  const shareRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const headings = {
    win: { emoji: "🏆", title: "You Win!", sub: `You beat ${challenge.creator_name}!` },
    loss: { emoji: "😤", title: "So Close!", sub: `${challenge.creator_name} keeps the crown.` },
    tie: { emoji: "🤝", title: "It's a Tie!", sub: "Perfectly matched!" },
  };
  const h = headings[outcome];

  const handleShare = useCallback(async () => {
    if (!shareRef.current || sharing) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(shareRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `staysharp-challenge-${challenge.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Share card generation failed:", err);
    }
    setSharing(false);
  }, [challenge.id, sharing]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-5 max-w-[420px] mx-auto text-center"
    >
      {showConfetti && <ConfettiBurst trigger={true} originX={200} originY={200} />}

      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
        className="text-7xl mb-4"
      >
        {h.emoji}
      </motion.span>

      <h2 className="font-display text-2xl font-800 text-foreground mb-1">{h.title}</h2>
      <p className="text-muted-foreground text-sm mb-8">{h.sub}</p>

      {/* Player comparison */}
      <div className="flex gap-3 w-full mb-8">
        {[
          { name: challenge.creator_name, score: challenge.creator_score, time: challenge.creator_time, label: "Creator" },
          { name: challengerName, score: challengerScore, time: challengerTime, label: "You" },
        ].map((p) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 bg-card rounded-2xl p-4"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{p.label}</p>
            <p className="font-display text-sm font-700 text-foreground truncate">{p.name}</p>
            <p className="font-display text-2xl font-800 text-foreground mt-1">{p.score}%</p>
            <p className="text-xs text-muted-foreground mt-1">⏱️ {formatTime(p.time)}</p>
          </motion.div>
        ))}
      </div>

      {/* Buttons */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onRematch}
        className="w-full py-4 rounded-2xl gradient-teal text-primary-foreground font-display font-700 text-base shadow-lg mb-3"
      >
        🔄 Rematch
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleShare}
        disabled={sharing}
        className="w-full py-4 rounded-2xl border border-border text-foreground font-display font-600 text-base hover:bg-card transition-colors mb-3"
      >
        {sharing ? "Generating…" : "📸 Share Result"}
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onHome}
        className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Back to Home
      </motion.button>

      {/* Hidden share card for image generation */}
      <div className="fixed -left-[9999px] top-0">
        <ShareCard
          ref={shareRef}
          topic={challenge.topic}
          difficulty={challenge.difficulty}
          creatorName={challenge.creator_name}
          creatorScore={challenge.creator_score}
          creatorTime={challenge.creator_time}
          challengerName={challengerName}
          challengerScore={challengerScore}
          challengerTime={challengerTime}
          outcome={outcome}
        />
      </div>
    </motion.div>
  );
}
