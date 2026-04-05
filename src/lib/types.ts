export type Difficulty = "beginner" | "intermediate" | "advanced";
export type QuestionCount = 5 | 8 | 10 | 15;

export interface QuizQuestion {
  tag: string;
  q: string;
  choices: string[];
  correct: number;
  explanation: string;
}

export interface QuizConfig {
  input: string;
  difficulty: Difficulty;
  count: QuestionCount;
}

export type ScreenState = "setup" | "loading" | "quiz" | "complete" | "history" | "challenge-created" | "my-challenges" | "profile";

export interface QuizResult {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
}

export interface QuizHistoryEntry {
  id: string;
  topic: string;
  difficulty: Difficulty;
  totalQuestions: number;
  correctAnswers: number;
  xp: number;
  percentage: number;
  completedAt: string;
}

export interface Challenge {
  id: string;
  topic: string;
  difficulty: string;
  question_count: number;
  questions: QuizQuestion[];
  creator_name: string;
  creator_score: number;
  creator_time: number;
  challenger_name: string | null;
  challenger_score: number | null;
  challenger_time: number | null;
  created_at: string;
  expires_at: string;
}

export type ChallengePageState = "loading" | "landing" | "name-entry" | "quiz" | "result" | "expired" | "taken" | "own-link" | "not-found";
