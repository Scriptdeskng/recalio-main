import { useState, useEffect, useCallback } from "react";
import type { QuizHistoryEntry } from "@/lib/types";

const STORAGE_KEY = "staysharp_history";

export function useQuizHistory() {
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const save = useCallback((entries: QuizHistoryEntry[]) => {
    setHistory(entries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, []);

  const addEntry = useCallback((entry: Omit<QuizHistoryEntry, "id" | "completedAt">) => {
    const newEntry: QuizHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
    };
    setHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, 50); // keep last 50
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
