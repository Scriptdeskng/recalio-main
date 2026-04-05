"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Check } from "lucide-react";
import { storage } from "@/lib/storage";
import { getPlayerAuth } from "@/lib/player-auth";
import { authAPI } from "@/lib/api/auth";
import { useToast } from "@/hooks/use-toast";

interface ProfileScreenProps {
  onBack: () => void;
  totalXp: number;
  totalQuizzes: number;
  averageScore: number;
}

export default function ProfileScreen({ onBack, totalXp, totalQuizzes, averageScore }: ProfileScreenProps) {
  const [name, setName] = useState(() => storage.getPlayerName() || "");
  const [editingName, setEditingName] = useState(false);
  const { toast } = useToast();

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed) {
      storage.setPlayerName(trimmed);
      
      // Update backend if user is authenticated
      const playerAuth = getPlayerAuth();
      if (playerAuth) {
        try {
          await authAPI.updatePlayer(playerAuth.msisdn, { full_name: trimmed });
          toast({
            title: "Success",
            description: "Profile updated successfully",
          });
        } catch (error) {
          console.error("Failed to update profile:", error);
          toast({
            title: "Warning",
            description: "Name saved locally, but server update failed",
            variant: "destructive",
          });
        }
      }
    }
    setEditingName(false);
  };

  const stats = [
    { emoji: "🏆", value: totalQuizzes, label: "Quizzes" },
    { emoji: "⭐", value: totalXp, label: "Total XP" },
    { emoji: "📊", value: `${averageScore}%`, label: "Avg Score" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="min-h-screen px-5 py-8 max-w-[420px] mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-lg font-700 text-foreground">Profile</h2>
        <div className="w-10" />
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full gradient-teal flex items-center justify-center mb-3">
          <span className="text-2xl">👤</span>
        </div>
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground text-center w-40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Your name"
            />
            <button onClick={saveName} className="text-primary">
              <Check className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 group">
            <span className="font-display text-base font-700 text-foreground">
              {name || "Set your name"}
            </span>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 bg-card rounded-2xl p-3 text-center"
          >
            <span className="text-lg">{s.emoji}</span>
            <p className="font-display text-lg font-800 text-foreground mt-0.5">{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
