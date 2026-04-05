"use client";

import { useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { QuizQuestion } from "@/lib/types";
import ConfettiBurst from "../ConfettiBurst";
import AnswerChoices from "./AnswerChoices";

interface QuizCardProps {
  question: QuizQuestion;
  questionIndex: number;
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  showConfetti: boolean;
  answered: boolean;
  onAnswer: (index: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export default function QuizCard({
  question,
  questionIndex,
  selectedAnswer,
  isCorrect,
  showConfetti,
  answered,
  onAnswer,
  scrollContainerRef,
}: QuizCardProps) {
  const explanationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur();
  }, [question]);

  const scrollToExplanation = useCallback(() => {
    const container = scrollContainerRef.current;
    const explanation = explanationRef.current;
    if (!container || !explanation) return;

    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const explanationRect = explanation.getBoundingClientRect();
      const scrollOffset = explanationRect.top - containerRect.top + container.scrollTop - 16;
      container.scrollTo({ top: scrollOffset, behavior: "smooth" });
    });
  }, [scrollContainerRef]);

  return (
    <div className="relative flex items-start justify-center">
      <div className="relative w-full bg-card rounded-3xl p-6 shadow-xl z-10">
        <ConfettiBurst trigger={showConfetti} originX={180} originY={150} />

        <span className="inline-block px-3 py-1 rounded-full bg-accent-dim/15 text-primary text-xs font-medium mb-4">
          {question.tag}
        </span>

        <h3 className="font-display text-lg font-700 text-foreground mb-6 leading-snug">
          {question.q}
        </h3>

        <div key={questionIndex}>
          <AnswerChoices
            choices={question.choices}
            correctIndex={question.correct}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
            onAnswer={onAnswer}
          />
        </div>

        <AnimatePresence>
          {answered && (
            <motion.div
              ref={explanationRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onAnimationComplete={scrollToExplanation}
              className="overflow-hidden"
            >
              <div
                className={`mt-4 p-4 rounded-xl border ${
                  isCorrect
                    ? "bg-success/5 border-success/20"
                    : "bg-muted/30 border-border"
                }`}
              >
                <p className="text-xs font-bold text-primary mb-1">
                  {isCorrect ? "✅ Correct!" : "💡 Explanation"}
                </p>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="h-24 shrink-0" />
    </div>
  );
}
