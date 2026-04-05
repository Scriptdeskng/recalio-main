import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import type { QuizConfig, Difficulty, QuestionCount, ScreenState } from "@/lib/types";
import { DEFAULT_TOPIC_CHIPS } from "@/lib/constants";
import MenuSheet from "./MenuSheet";

interface SetupScreenProps {
  config: QuizConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuizConfig>>;
  onGenerate: () => void;
  onNavigate: (screen: ScreenState) => void;
  historyCount: number;
  challengeCount: number;
  recentTopics: string[];
}

export default function SetupScreen({ config, setConfig, onGenerate, onNavigate, historyCount, challengeCount, recentTopics }: SetupScreenProps) {
  const isValid = config.input.trim().length >= 2;

  const validRecent = recentTopics.filter((t) => t.trim().length > 0);
  const useRecent = validRecent.length >= 3;
  const chips = useRecent
    ? validRecent.map((t) => ({ emoji: "🕐", label: t }))
    : DEFAULT_TOPIC_CHIPS.map((c) => ({ emoji: c.emoji, label: c.label }));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [config.input]);

  const difficulties: { value: Difficulty; label: string }[] = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const counts: QuestionCount[] = [5, 8, 10, 15];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-[100dvh] px-5 py-6 max-w-[420px] mx-auto flex flex-col overflow-hidden"
    >
      {/* Top Bar: Logo + Menu */}
      <div className="relative flex items-center justify-between">
        <button
          onClick={() => onNavigate("profile")}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <User size={18} />
        </button>
        <a href="/">
          <img
            src="/staysharp-logo.png"
            alt="StaySharp"
            className="absolute left-1/2 -translate-x-1/2 h-6"
          />
        </a>
        <MenuSheet
          historyCount={historyCount}
          challengeCount={challengeCount}
          onNavigate={onNavigate}
        />
      </div>

      {/* Centered content wrapper */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="font-display text-lg font-700 text-foreground">
            What are you studying today?
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {historyCount === 0
              ? "Enter any topic or paste your notes — get fresh questions instantly and learn from explanations as you go."
              : "Type a topic or paste your notes — we'll handle the rest."}
          </p>
        </div>

        {/* Smart Input */}
        <div className="mb-3">
          <textarea
            ref={textareaRef}
            placeholder="Enter a topic, question, or paste your notes…"
            value={config.input}
            onChange={(e) => setConfig((c) => ({ ...c, input: e.target.value }))}
            rows={1}
            className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]"
          />
        </div>

        {/* Topic Chips */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-5">
          {chips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => setConfig((c) => ({ ...c, input: chip.label }))}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                config.input === chip.label
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {chip.emoji} {chip.label}
            </button>
          ))}
        </div>

        {/* Difficulty & Count */}
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Difficulty
            </label>
            <div className="flex gap-1">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setConfig((c) => ({ ...c, difficulty: d.value }))}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    config.difficulty === d.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-muted-foreground border border-border"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Questions
            </label>
            <div className="flex gap-1">
              {counts.map((c) => (
                <button
                  key={c}
                  onClick={() => setConfig((prev) => ({ ...prev, count: c }))}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    config.count === c
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-muted-foreground border border-border"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!isValid}
          onClick={onGenerate}
          className="w-full py-4 rounded-2xl gradient-teal text-primary-foreground font-display font-700 text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Start Quiz
        </motion.button>
      </div>
    </motion.div>
  );
}
