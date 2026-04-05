import { apiClient } from "./client";
import type { Challenge, Difficulty, QuizQuestion } from "@/lib/types";

export interface CreateChallengePayload {
  attempt_id: string | null;
  creator_name: string;
  player_msisdn?: string;
  input: string;
  difficulty: Difficulty;
  count: number;
  questions: QuizQuestion[];
  answers: number[];
  duration_seconds: number;
}

export interface CreateChallengeResponse { challenge_id: string; share_url: string; }

export async function createChallenge(payload: CreateChallengePayload) {
  return apiClient.post<CreateChallengeResponse>("/api/v1/challenges", payload);
}

export async function getChallenge(challengeId: string) {
  return apiClient.get<Challenge>(`/api/v1/challenges/${challengeId}`);
}

export async function getMyChallenges(ids: string[]) {
  return apiClient.post<Challenge[]>("/api/v1/challenges/query", { ids });
}

export async function completeChallenge(challengeId: string, payload: { challenger_name: string; answers: number[]; duration_seconds: number; }) {
  return apiClient.post(`/api/v1/challenges/${challengeId}/complete`, payload);
}

export async function createRematchChallenge(challengeId: string, payload: { creator_name: string; creator_score: number; creator_time: number; }) {
  return apiClient.post<CreateChallengeResponse>(`/api/v1/challenges/${challengeId}/rematch`, payload);
}
