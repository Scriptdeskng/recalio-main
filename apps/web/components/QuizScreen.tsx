"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { QuizQuestion, QuizResult } from "@/lib/types";
import QuizHeader from "./quiz/QuizHeader";
import ChallengeQuizHeader from "./challenge/ChallengeQuizHeader";
import QuizCard from "./quiz/QuizCard";
import QuizFooter from "./quiz/QuizFooter";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface QuizScreenProps {
  questions: QuizQuestion[];
  currentIndex: number;
  results: QuizResult[];
  xp: number;
  topic: string;
  onAnswer: (answer: number) => boolean;
  onNext: () => void;
  onExit: () => void;
  targetScore?: number;
  timerElapsed?: number;
}

export default function QuizScreen({
  questions,
  currentIndex,
  results,
  xp,
  topic,
  onAnswer,
  onNext,
  onExit,
  targetScore,
  timerElapsed,
}: QuizScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpFloat, setXpFloat] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const hasAdvancedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  // Reset local state when question changes or answered resets
  useEffect(() => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    hasAdvancedRef.current = false;
  }, [currentIndex]);

  useEffect(() => {
    if (selectedAnswer === null) {
      hasAdvancedRef.current = false;
    }
  }, [selectedAnswer]);

  const question = questions[currentIndex];
  const answered = selectedAnswer !== null;

  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(index);
      const correct = onAnswer(index);
      setIsCorrect(correct);
      if (correct) {
        setShowConfetti(true);
        setXpFloat(true);
        setTimeout(() => setShowConfetti(false), 1500);
        setTimeout(() => setXpFloat(false), 1000);
      }
    },
    [selectedAnswer, onAnswer]
  );

  const handleExit = useCallback(() => {
    setShowExitDialog(false);
    onExit();
  }, [onExit]);

  const handleAdvance = useCallback(() => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    onNextRef.current();
  }, []);

  // Guard: during exit animation, questions may be cleared
  if (!question) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, x: -40 }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="h-[100dvh] px-5 py-6 max-w-[420px] mx-auto flex flex-col"
    >
      {targetScore !== undefined && timerElapsed !== undefined ? (
        <ChallengeQuizHeader
          topic={topic}
          targetScore={targetScore}
          elapsed={timerElapsed}
          onExitClick={() => setShowExitDialog(true)}
        />
      ) : (
        <QuizHeader
          topic={topic}
          xp={xp}
          xpFloat={xpFloat}
          onExitClick={() => setShowExitDialog(true)}
        />
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="text-[11px] text-muted-foreground mb-1">
          Question {currentIndex + 1} of {questions.length}
        </div>
        <div className="h-1.5 rounded-full bg-card overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-teal"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%`,
            }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto pb-24">
        <QuizCard
          question={question}
          questionIndex={currentIndex}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
          showConfetti={showConfetti}
          answered={answered}
          onAnswer={handleAnswer}
          scrollContainerRef={scrollContainerRef}
        />
      </div>

      <QuizFooter
        answered={answered}
        isCorrect={isCorrect}
        isLastQuestion={currentIndex + 1 >= questions.length}
        onAdvance={handleAdvance}
      />

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave quiz?</AlertDialogTitle>
            <AlertDialogDescription>Your progress will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExit}>Leave</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
