import { apiClient } from "./client";

export interface QuizAttemptResponse {
  id: number;
  input: string;
  mode: string;
  difficulty: string;
  count: number;
  score: number | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface ChallengeResponse {
  id: number;
  challenge_id: string;
  creator_name: string;
  input: string;
  difficulty: string;
  total_questions: number;
  created_at: string;
}

export const playersAPI = {
  getQuizzes: (msisdn: string) => 
    apiClient.get<QuizAttemptResponse[]>(`/api/v1/players/${msisdn}/quizzes`),
  
  getChallenges: (msisdn: string) => 
    apiClient.get<ChallengeResponse[]>(`/api/v1/players/${msisdn}/challenges`),
};
