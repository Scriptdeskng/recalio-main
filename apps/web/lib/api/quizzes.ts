import { apiClient } from "./client";
import type { Difficulty, QuestionCount, QuizQuestion } from "@/lib/types";

export type GenerateQuizPayload = { input: string; mode: "topic" | "notes"; difficulty: Difficulty; count: QuestionCount | number; };
export type GenerateQuizResponse = { questions: QuizQuestion[] };

export async function generateQuiz(payload: GenerateQuizPayload) {
  return apiClient.post<GenerateQuizResponse>("/api/v1/quizzes/generate", payload);
}
