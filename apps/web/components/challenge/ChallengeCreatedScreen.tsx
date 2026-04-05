"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getWindowOrigin } from "@/lib/client-utils";

interface ChallengeCreatedScreenProps {
  challengeId: string;
  topic: string;
  score: number;
  onHome: () => void;
}

export default function ChallengeCreatedScreen({ challengeId, topic, score, onHome }: ChallengeCreatedScreenProps) {
  const [copied, setCopied] = useState(false);
  const challengeUrl = `${getWindowOrigin()}/challenge/${challengeId}`;
  const shareMessage = `I scored ${score}% on ${topic} — can you beat me? ${challengeUrl}`;
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "StaySharp Challenge",
        text: `I scored ${score}% on ${topic} — can you beat me?`,
        url: challengeUrl,
      });
    } catch (err: any) {
      // User cancelled or share failed — ignore AbortError
      if (err?.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
  };

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
        🔗
      </motion.span>

      <h2 className="font-display text-2xl font-800 text-foreground mb-2">Challenge Created!</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Share the link below and see if your friend can beat your score.
      </p>

      {/* Link display */}
      <div className="w-full bg-card rounded-2xl p-4 mb-6 border border-border">
        <p className="text-xs text-muted-foreground mb-2">Challenge link</p>
        <p className="text-sm text-foreground font-mono break-all">{challengeUrl}</p>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleCopy}
        className="w-full py-4 rounded-2xl gradient-teal text-primary-foreground font-display font-700 text-base shadow-lg mb-3"
      >
        {copied ? "✅ Copied!" : "📋 Copy Link"}
      </motion.button>

      {canShare ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleShare}
          className="w-full py-4 rounded-2xl border border-border text-foreground font-display font-600 text-base hover:bg-card transition-colors mb-3"
        >
          📤 Share Challenge
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleWhatsApp}
          className="w-full py-4 rounded-2xl border border-border text-foreground font-display font-600 text-base hover:bg-card transition-colors mb-3"
        >
          💬 Share on WhatsApp
        </motion.button>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onHome}
        className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Back to Home
      </motion.button>
    </motion.div>
  );
}
