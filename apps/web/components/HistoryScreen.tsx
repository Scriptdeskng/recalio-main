"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizHistoryEntry } from "@/lib/types";
import { COMPLETION_TIERS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function ClearHistoryButton({ onClear }: { onClear: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
      >
        Clear History
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all history?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setOpen(false); onClear(); }}>Clear</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface HistoryScreenProps {
  history: QuizHistoryEntry[];
  onBack: () => void;
  onClear: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function getTierEmoji(pct: number) {
  const tier = COMPLETION_TIERS.find((t) => pct >= t.min);
  return tier?.emoji || "📚";
}

export default function HistoryScreen({
  history,
  onBack,
  onClear,
}: HistoryScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="min-h-screen px-5 py-8 max-w-[420px] mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          ←
        </button>
        <h2 className="font-display text-lg font-700 text-foreground">Quiz History</h2>
        <div className="w-10" />
      </div>




      {/* History List */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📝</span>
          <p className="font-display text-base font-600 text-foreground mb-1">No quizzes yet</p>
          <p className="text-sm text-muted-foreground">Complete a quiz to see your history here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            <AnimatePresence>
              {history.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl p-4 flex items-center gap-3"
                >
                  <span className="text-2xl">{getTierEmoji(entry.percentage)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-600 text-foreground truncate">
                      {entry.topic}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(entry.completedAt)} · {entry.difficulty}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-base font-800 text-foreground">
                      {entry.percentage}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.correctAnswers}/{entry.totalQuestions}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <ClearHistoryButton onClear={onClear} />
        </>
      )}
    </motion.div>
  );
}
