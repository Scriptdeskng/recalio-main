"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Challenge } from "@/lib/types";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { getMyChallenges } from "@/lib/api/challenges";
import { storage } from "@/lib/storage";

interface MyChallengesScreenProps {
  onBack: () => void;
}

export default function MyChallengesScreen({ onBack }: MyChallengesScreenProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const ids = storage.getMyChallenges();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    getMyChallenges(ids)
      .then((data) => setChallenges(data))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load your challenges.");
      })
      .finally(() => setLoading(false));
  }, []);

  const copyLink = async (id: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/challenge/${id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pending = challenges.filter((c) => !c.challenger_name);
  const completed = challenges.filter((c) => !!c.challenger_name);

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="min-h-screen px-5 py-8 max-w-[420px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-lg font-700 text-foreground">My Challenges</h2>
        <div className="w-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">⚔️</span>
          <p className="font-display text-base font-600 text-foreground mb-1">No challenges yet</p>
          <p className="text-sm text-muted-foreground">Complete a quiz and tap "Challenge a Friend" to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Pending</p>
              <div className="space-y-3">
                {pending.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-600 text-foreground truncate">{c.topic}</p>
                        <p className="text-[11px] text-muted-foreground">{c.difficulty} · {c.question_count}Q · Your score: {c.creator_score}%</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium shrink-0 ml-2">Waiting</span>
                    </div>
                    <button onClick={() => copyLink(c.id)} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors">
                      {copiedId === c.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedId === c.id ? "Copied!" : "Copy Link"}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Completed</p>
              <div className="space-y-3">
                {completed.map((c, i) => {
                  const youWon = c.creator_score > (c.challenger_score || 0) || (c.creator_score === c.challenger_score && c.creator_time < (c.challenger_time || Infinity));
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-600 text-foreground truncate">{c.topic}</p>
                          <p className="text-[11px] text-muted-foreground">{c.difficulty} · {c.question_count}Q</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ml-2 ${youWon ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                          {youWon ? "Won" : "Lost"}
                        </span>
                      </div>
                      <div className="flex gap-3 text-center">
                        <div className="flex-1 bg-background rounded-xl py-2">
                          <p className="text-[10px] text-muted-foreground">You</p>
                          <p className="font-display text-sm font-700 text-foreground">{c.creator_score}%</p>
                        </div>
                        <div className="flex-1 bg-background rounded-xl py-2">
                          <p className="text-[10px] text-muted-foreground">{c.challenger_name}</p>
                          <p className="font-display text-sm font-700 text-foreground">{c.challenger_score}%</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
