/**
 * Centralized, SSR-safe storage management for Recallio
 */
import { safeLocalStorage } from "./client-utils";

const KEYS = {
  PLAYER_NAME: "staysharp_player_name",
  MY_CHALLENGES: "staysharp_my_challenges",
  QUIZ_HISTORY: "staysharp_history",
} as const;

export const storage = {
  // Player name operations
  getPlayerName: (): string | null => {
    return safeLocalStorage.getItem(KEYS.PLAYER_NAME);
  },
  
  setPlayerName: (name: string): void => {
    safeLocalStorage.setItem(KEYS.PLAYER_NAME, name);
  },
  
  // My challenges operations
  getMyChallenges: (): string[] => {
    const raw = safeLocalStorage.getItem(KEYS.MY_CHALLENGES);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  
  addMyChallenge: (challengeId: string): void => {
    const challenges = storage.getMyChallenges();
    if (!challenges.includes(challengeId)) {
      challenges.push(challengeId);
      safeLocalStorage.setItem(KEYS.MY_CHALLENGES, JSON.stringify(challenges));
    }
  },
  
  // Quiz history operations
  getQuizHistory: <T>(): T[] => {
    const raw = safeLocalStorage.getItem(KEYS.QUIZ_HISTORY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  
  setQuizHistory: <T>(history: T[]): void => {
    safeLocalStorage.setItem(KEYS.QUIZ_HISTORY, JSON.stringify(history));
  },
  
  clearQuizHistory: (): void => {
    safeLocalStorage.removeItem(KEYS.QUIZ_HISTORY);
  },
};
