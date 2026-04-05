import { authAPI, type SubscriptionStatusResponse } from "@/lib/api/auth";
import { playersAPI, type QuizAttemptResponse } from "@/lib/api/players";
import { safeLocalStorage } from "@/lib/client-utils";
import type { QuizHistoryEntry } from "@/lib/types";

// Session TTL: 30 days in milliseconds
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface PlayerAuth {
  msisdn: string;
  telco: string;
  hasActiveSubscription: boolean;
  subscriptionData?: any;
  expiresAt?: number; // timestamp when session expires
}

/**
 * Get stored player authentication data (returns null if expired)
 */
export function getPlayerAuth(): PlayerAuth | null {
  const msisdn = safeLocalStorage.getItem("player_msisdn");
  const telco = safeLocalStorage.getItem("player_telco");
  const authData = safeLocalStorage.getItem("player_auth");
  const expiresAt = safeLocalStorage.getItem("player_auth_expires");

  if (!msisdn || !telco) {
    return null;
  }

  // Check if session has expired
  if (expiresAt) {
    const expiryTime = parseInt(expiresAt, 10);
    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      // Session expired, clear auth data
      clearPlayerAuth();
      return null;
    }
  }

  const parsedAuth = authData ? JSON.parse(authData) : null;

  return {
    msisdn,
    telco,
    hasActiveSubscription: parsedAuth?.has_active_subscription || false,
    subscriptionData: parsedAuth?.active_subscription,
    expiresAt: expiresAt ? parseInt(expiresAt, 10) : undefined,
  };
}

/**
 * Update stored player authentication data
 */
export function updatePlayerAuth(data: Partial<PlayerAuth>): void {
  const current = getPlayerAuth();
  
  if (current) {
    if (data.msisdn) safeLocalStorage.setItem("player_msisdn", data.msisdn);
    if (data.telco) safeLocalStorage.setItem("player_telco", data.telco);
    
    if (data.hasActiveSubscription !== undefined || data.subscriptionData !== undefined) {
      const authData = {
        has_active_subscription: data.hasActiveSubscription ?? current.hasActiveSubscription,
        active_subscription: data.subscriptionData ?? current.subscriptionData,
      };
      safeLocalStorage.setItem("player_auth", JSON.stringify(authData));
    }
    
    // Update expiry if provided, otherwise extend session
    const expiresAt = data.expiresAt ?? Date.now() + SESSION_TTL_MS;
    safeLocalStorage.setItem("player_auth_expires", expiresAt.toString());
  }
}

/**
 * Store new player authentication data with TTL
 */
export function setPlayerAuth(data: Omit<PlayerAuth, 'expiresAt'>): void {
  safeLocalStorage.setItem("player_msisdn", data.msisdn);
  safeLocalStorage.setItem("player_telco", data.telco);
  
  const authData = {
    has_active_subscription: data.hasActiveSubscription,
    active_subscription: data.subscriptionData,
  };
  safeLocalStorage.setItem("player_auth", JSON.stringify(authData));
  
  // Set expiry to 30 days from now
  const expiresAt = Date.now() + SESSION_TTL_MS;
  safeLocalStorage.setItem("player_auth_expires", expiresAt.toString());
}

/**
 * Clear player authentication data
 */
export function clearPlayerAuth(): void {
  safeLocalStorage.removeItem("player_msisdn");
  safeLocalStorage.removeItem("player_telco");
  safeLocalStorage.removeItem("player_auth");
  safeLocalStorage.removeItem("player_auth_expires");
}

/**
 * Check if player is authenticated
 */
export function isPlayerAuthenticated(): boolean {
  return getPlayerAuth() !== null;
}

/**
 * Check subscription status from API and update local storage
 */
export async function checkSubscriptionStatus(): Promise<SubscriptionStatusResponse | null> {
  const playerAuth = getPlayerAuth();
  
  if (!playerAuth) {
    return null;
  }

  try {
    const result = await authAPI.checkSubscription(playerAuth.msisdn);
    
    // Update local storage with latest subscription status
    updatePlayerAuth({
      hasActiveSubscription: result.data.has_active_subscription,
      subscriptionData: result.data.active_subscription,
    });
    
    return result;
  } catch (error) {
    console.error("Failed to check subscription status:", error);
    return null;
  }
}

/**
 * Check if player has active subscription (from local storage)
 */
export function hasActiveSubscription(): boolean {
  const playerAuth = getPlayerAuth();
  return playerAuth?.hasActiveSubscription || false;
}

/**
 * Fetch player's quiz history from backend
 * Converts backend QuizAttemptResponse to QuizHistoryEntry format
 */
export async function fetchPlayerQuizHistory(): Promise<QuizHistoryEntry[]> {
  const playerAuth = getPlayerAuth();
  
  if (!playerAuth) {
    return [];
  }

  try {
    const quizzes = await playersAPI.getQuizzes(playerAuth.msisdn);
    
    // Convert backend format to frontend QuizHistoryEntry format
    const history: QuizHistoryEntry[] = quizzes.map((quiz: QuizAttemptResponse) => ({
      id: quiz.id.toString(),
      topic: quiz.input.length > 40 ? quiz.input.slice(0, 37) + "…" : quiz.input,
      difficulty: quiz.difficulty as "beginner" | "intermediate" | "advanced",
      totalQuestions: quiz.count,
      correctAnswers: quiz.score !== null ? Math.round((quiz.score / 100) * quiz.count) : 0,
      xp: quiz.score !== null ? Math.round(quiz.score * quiz.count * 0.5) : 0,
      percentage: quiz.score !== null ? Math.round(quiz.score) : 0,
      completedAt: quiz.created_at,
    }));
    
    return history;
  } catch (error) {
    console.error("Failed to fetch player quiz history:", error);
    return [];
  }
}
