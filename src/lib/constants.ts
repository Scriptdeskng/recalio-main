export const DEFAULT_TOPIC_CHIPS = [
  { emoji: "🔬", label: "Science" },
  { emoji: "📜", label: "History" },
  { emoji: "📐", label: "Math" },
  { emoji: "✍️", label: "English" },
  { emoji: "🗺️", label: "Geography" },
  { emoji: "💻", label: "Technology" },
] as const;

export const XP_PER_CORRECT = 10;

export const COMPLETION_TIERS = [
  { min: 100, emoji: "🏆", title: "Perfect Score!" },
  { min: 80, emoji: "🎉", title: "Excellent Work!" },
  { min: 60, emoji: "👍", title: "Good Job!" },
  { min: 40, emoji: "💪", title: "Keep Trying!" },
  { min: 0, emoji: "📚", title: "Study More!" },
] as const;
