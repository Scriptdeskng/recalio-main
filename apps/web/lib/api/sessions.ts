import { apiClient } from "./client";
import type { Difficulty, QuizQuestion } from "@/lib/types";

export interface CompleteSessionPayload {
  input: string;
  mode: "topic" | "notes";
  difficulty: Difficulty;
  count: number;
  answers: number[];
  duration_seconds: number;
  player_name?: string;
  player_msisdn?: string;
  questions: QuizQuestion[];
}

export interface CompleteSessionResponse {
  attempt_id: string;
  correct_answers: number;
  total_questions: number;
  score_percent: number;
  xp_earned: number;
}

export async function completeSession(payload: CompleteSessionPayload) {
  return apiClient.post<CompleteSessionResponse>("/api/v1/sessions/complete", payload);
}
