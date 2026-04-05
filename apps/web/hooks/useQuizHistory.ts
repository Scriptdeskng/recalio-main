import { useState, useEffect, useCallback } from "react";
import type { QuizHistoryEntry } from "@/lib/types";
import { storage } from "@/lib/storage";

export function useQuizHistory() {
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(storage.getQuizHistory<QuizHistoryEntry>());
  }, []);

  const save = useCallback((entries: QuizHistoryEntry[]) => {
    setHistory(entries);
    storage.setQuizHistory(entries);
  }, []);

  const addEntry = useCallback((entry: Omit<QuizHistoryEntry, "id" | "completedAt">) => {
    const newEntry: QuizHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
    };
    setHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, 50); // keep last 50
      storage.setQuizHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    save([]);
  }, [save]);

  const totalXp = history.reduce((sum, e) => sum + e.xp, 0);
  const totalQuizzes = history.length;
  const averageScore = totalQuizzes > 0
    ? Math.round(history.reduce((sum, e) => sum + e.percentage, 0) / totalQuizzes)
    : 0;

  const recentTopics = history
    .map((e) => e.topic)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 6);

  return { history, addEntry, clearHistory, totalXp, totalQuizzes, averageScore, recentTopics };
}
