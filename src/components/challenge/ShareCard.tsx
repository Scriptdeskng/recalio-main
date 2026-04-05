import { forwardRef } from "react";

interface ShareCardProps {
  topic: string;
  difficulty: string;
  creatorName: string;
  creatorScore: number;
  creatorTime: number;
  challengerName: string;
  challengerScore: number;
  challengerTime: number;
  outcome: "win" | "loss" | "tie";
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ topic, difficulty, creatorName, creatorScore, creatorTime, challengerName, challengerScore, challengerTime, outcome }, ref) => {
    const outcomeEmoji = outcome === "win" ? "🏆" : outcome === "tie" ? "🤝" : "😤";
    const outcomeText = outcome === "win" ? `${challengerName} Wins!` : outcome === "tie" ? "It's a Tie!" : `${creatorName} Wins!`;

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          padding: 32,
          background: "linear-gradient(135deg, hsl(222, 20%, 5%), hsl(224, 18%, 11%))",
          borderRadius: 20,
          fontFamily: "'Inter', sans-serif",
          color: "hsl(228, 33%, 96%)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{outcomeEmoji}</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{outcomeText}</div>
          <div style={{ fontSize: 13, color: "hsl(224, 14%, 53%)", marginTop: 4 }}>
            {topic} • {difficulty}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          {[
            { name: creatorName, score: creatorScore, time: creatorTime },
            { name: challengerName, score: challengerScore, time: challengerTime },
          ].map((p, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: "hsl(224, 18%, 15%)",
                borderRadius: 14,
                padding: 16,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, color: "hsl(224, 14%, 53%)", marginBottom: 6 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{p.score}%</div>
              <div style={{ fontSize: 12, color: "hsl(224, 14%, 53%)", marginTop: 4 }}>
                ⏱️ {formatTime(p.time)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "hsl(224, 14%, 33%)" }}>
          StaySharp
        </div>
      </div>
    );
  }
);
ShareCard.displayName = "ShareCard";

export default ShareCard;
