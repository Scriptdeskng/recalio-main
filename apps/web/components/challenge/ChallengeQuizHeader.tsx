"use client";

interface ChallengeQuizHeaderProps {
  topic: string;
  targetScore: number;
  elapsed: number;
  onExitClick: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ChallengeQuizHeader({ topic, targetScore, elapsed, onExitClick }: ChallengeQuizHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExitClick}
          className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border"
        >
          ✕
        </button>
        <p className="font-display text-base font-700 text-foreground truncate max-w-[140px]">
          {topic}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-full bg-accent-dim/15 flex items-center gap-1.5">
          <span className="text-sm">🎯</span>
          <span className="text-sm font-display font-700 text-primary">Target: {targetScore}%</span>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-card border border-border flex items-center gap-1.5">
          <span className="text-sm">⏱️</span>
          <span className="text-sm font-display font-700 text-foreground">{formatTime(elapsed)}</span>
        </div>
      </div>
    </div>
  );
}
