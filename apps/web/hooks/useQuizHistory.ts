import { useState, useEffect, useCallback } from "react";
import type { QuizHistoryEntry } from "@/lib/types";
import { storage } from "@/lib/storage";
import { isPlayerAuthenticated, fetchPlayerQuizHistory } from "@/lib/player-auth";

export function useQuizHistory() {
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      
      // Get local history first
      const localHistory = storage.getQuizHistory<QuizHistoryEntry>();
      
      // If user is authenticated, fetch backend history and merge
      if (isPlayerAuthenticated()) {
        try {
          const backendHistory = await fetchPlayerQuizHistory();
          
          // Merge backend and local history, remove duplicates by ID
          const mergedHistory = [...backendHistory, ...localHistory];
          const uniqueHistory = Array.from(
            new Map(mergedHistory.map(item => [item.id, item])).values()
          ).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
          
          setHistory(uniqueHistory.slice(0, 50)); // Keep last 50
          
          // Update local storage with merged history
          storage.setQuizHistory(uniqueHistory.slice(0, 50));
        } catch (error) {
          console.error("Failed to load backend history:", error);
          setHistory(localHistory);
        }
      } else {
        setHistory(localHistory);
      }
      
      setIsLoading(false);
    };
    
    loadHistory();
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

  return { 
    history, 
    addEntry, 
    clearHistory, 
    totalXp, 
    totalQuizzes, 
    averageScore, 
    recentTopics,
    isLoading,
  };
}
