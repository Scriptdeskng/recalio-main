import { motion } from "framer-motion";

interface AnswerChoicesProps {
  choices: string[];
  correctIndex: number;
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  onAnswer: (index: number) => void;
}

const LETTERS = ["A", "B", "C", "D"];

export default function AnswerChoices({
  choices,
  correctIndex,
  selectedAnswer,
  isCorrect,
  onAnswer,
}: AnswerChoicesProps) {
  const answered = selectedAnswer !== null;

  return (
    <div className="space-y-3">
      {choices.map((choice, i) => {
        let choiceClass = "bg-muted/50 border-border";
        let letterClass = "bg-card text-muted-foreground";
        let icon = null;

        if (answered) {
          if (i === correctIndex) {
            choiceClass = "bg-success/10 border-success/30";
            letterClass = "bg-success text-success-foreground";
            icon = <span className="ml-auto text-success">✓</span>;
          } else if (i === selectedAnswer && !isCorrect) {
            choiceClass = "bg-destructive/10 border-destructive/30";
            letterClass = "bg-destructive text-destructive-foreground";
            icon = <span className="ml-auto text-destructive">✗</span>;
          }
        }

        return (
          <motion.button
            key={i}
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              onAnswer(i);
            }}
            animate={
              answered && i === selectedAnswer && !isCorrect
                ? { x: [0, -6, 6, -4, 4, 0] }
                : {}
            }
            transition={{ duration: 0.4 }}
            className={`quiz-answer-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${choiceClass} ${
              !answered ? "hover:border-primary/30 active:scale-[0.98]" : ""
            }`}
            disabled={answered}
          >
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${letterClass}`}>
              {LETTERS[i]}
            </span>
            <span className="text-foreground font-medium flex-1">{choice}</span>
            {icon}
          </motion.button>
        );
      })}
    </div>
  );
}
