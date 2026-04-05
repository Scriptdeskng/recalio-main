import AutoAdvanceRing from "../AutoAdvanceRing";

interface QuizFooterProps {
  answered: boolean;
  isCorrect: boolean | null;
  isLastQuestion: boolean;
  onAdvance: () => void;
}

export default function QuizFooter({ answered, isCorrect, isLastQuestion, onAdvance }: QuizFooterProps) {
  return (
    <div className="mt-4 flex justify-center h-14">
      {!answered && (
        <p className="text-sm text-muted-foreground animate-pulse">Tap an answer to continue</p>
      )}
      {answered && (
        <div className="flex items-center gap-3">
          {isCorrect && <AutoAdvanceRing duration={5} onComplete={onAdvance} />}
          <button
            type="button"
            onClick={onAdvance}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            {isLastQuestion ? "See Results" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
