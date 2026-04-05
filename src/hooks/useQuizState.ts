import { useState, useCallback, useRef } from "react";
import type { ScreenState, QuizConfig, QuizQuestion, QuizResult } from "@/lib/types";
import { XP_PER_CORRECT } from "@/lib/constants";

export function useQuizState() {
  const [screen, setScreen] = useState<ScreenState>("setup");
  const [config, setConfig] = useState<QuizConfig>({
    input: "",
    difficulty: "intermediate",
    count: 8,
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [xp, setXp] = useState(0);
  const questionsLengthRef = useRef(0);
  const currentIndexRef = useRef(0);

  const startQuiz = useCallback((qs: QuizQuestion[]) => {
    questionsLengthRef.current = qs.length;
    setQuestions(qs);
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setResults([]);
    setXp(0);
    setScreen("quiz");
  }, []);

  const answerQuestion = useCallback((selectedAnswer: number) => {
    const isCorrect = selectedAnswer === questions[currentIndex].correct;
    setResults((prev) => [...prev, { questionIndex: currentIndex, selectedAnswer, isCorrect }]);
    if (isCorrect) setXp((prev) => prev + XP_PER_CORRECT);
    return isCorrect;
  }, [questions, currentIndex]);

  const nextQuestion = useCallback(() => {
    if (currentIndexRef.current + 1 >= questionsLengthRef.current) {
      setScreen("complete");
    } else {
      setCurrentIndex((prev) => prev + 1);
      currentIndexRef.current += 1;
    }
  }, []);

  const resetToSetup = useCallback(() => {
    setScreen("setup");
    setConfig((prev) => ({ ...prev, input: "" }));
    setQuestions([]);
    setResults([]);
    setXp(0);
    currentIndexRef.current = 0;
    setCurrentIndex(0);
  }, []);

  const retryQuiz = useCallback(() => {
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setResults([]);
    setXp(0);
    setScreen("quiz");
  }, []);

  return {
    screen, setScreen,
    config, setConfig,
    questions,
    currentIndex,
    results,
    xp,
    startQuiz,
    answerQuestion,
    nextQuestion,
    resetToSetup,
    retryQuiz,
  };
}
