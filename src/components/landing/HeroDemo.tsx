import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const EXAMPLES = [
  // Students
  "WAEC 2024 chemistry past questions…",
  "Intro to macroeconomics lecture notes…",
  // Professionals
  "Project management best practices…",
  "Nigerian tax law updates 2025…",
  // Teachers & Groups
  "JSS3 biology revision: photosynthesis…",
  "Staff onboarding compliance checklist…",
];

const TYPE_SPEED = 45;
const PAUSE_AFTER_TYPE = 2000;
const ERASE_SPEED = 25;
const PAUSE_AFTER_ERASE = 300;

export default function HeroDemo() {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const currentExample = EXAMPLES[exampleIndex];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isTyping) {
      if (displayText.length < currentExample.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentExample.slice(0, displayText.length + 1));
        }, TYPE_SPEED);
      } else {
        timeout = setTimeout(() => setIsTyping(false), PAUSE_AFTER_TYPE);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, ERASE_SPEED);
      } else {
        timeout = setTimeout(() => {
          setExampleIndex((prev) => (prev + 1) % EXAMPLES.length);
          setIsTyping(true);
        }, PAUSE_AFTER_ERASE);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentExample]);

  return (
    <div className="w-full max-w-[280px] md:max-w-[320px]">
      <div className="bg-[#12151c] rounded-2xl border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Content */}
        <div className="px-3.5 py-4 flex flex-col">
          <p className="text-[10px] text-[#7a8599] font-medium mb-2">
            Your notes
          </p>
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 mb-3 h-[52px] flex items-start">
            <p className="text-[11px] md:text-[12px] text-white/70 leading-relaxed">
              {displayText}
              <span className="inline-block w-[2px] h-[13px] bg-[#2BD4BD] ml-[1px] align-middle animate-pulse" />
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#2BD4BD] text-[#0b0d12] text-[11px] md:text-[12px] font-bold">
            Generate quiz <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
