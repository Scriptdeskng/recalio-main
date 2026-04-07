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

// Subscription constants
export const FORTHSOFT_CHECKOUT_URL = process.env.NEXT_PUBLIC_FORTHSOFT_CHECKOUT_URL || "";
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
export const PAYSTACK_WEEKLY_PLAN_CODE = process.env.NEXT_PUBLIC_PAYSTACK_WEEKLY_PLAN_CODE || "";
export const PAYSTACK_MONTHLY_PLAN_CODE = process.env.NEXT_PUBLIC_PAYSTACK_MONTHLY_PLAN_CODE || "";
