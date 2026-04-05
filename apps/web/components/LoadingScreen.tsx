"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const STEPS = [
  { emoji: "🧠", label: "Analysing your topic" },
  { emoji: "❓", label: "Generating questions" },
  { emoji: "✅", label: "Preparing answer keys" },
  { emoji: "🎮", label: "Getting ready to play" },
];

interface LoadingScreenProps {
  isReady?: boolean;
}

export default function LoadingScreen({ isReady = false }: LoadingScreenProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Step 0 immediately, step 1 after 1s
    if (activeStep < 2) {
      const timer = setTimeout(() => {
        setActiveStep((prev) => prev + 1);
      }, activeStep === 0 ? 1000 : 1000);
      return () => clearTimeout(timer);
    }
  }, [activeStep]);

  // When API responds, advance to step 3 then 4
  useEffect(() => {
    if (isReady && activeStep >= 2) {
      setActiveStep(3);
    } else if (isReady && activeStep < 2) {
      // API was fast — jump ahead
      setActiveStep(3);
    }
  }, [isReady]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-5 max-w-[420px] mx-auto"
    >
      {/* Pulsing Orb */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full gradient-teal opacity-20 animate-pulse-glow" />
        <div className="absolute inset-3 rounded-full gradient-teal opacity-40 animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">⚡</span>
        </div>
      </div>

      <h2 className="font-display text-xl font-700 text-foreground mb-3">
        Building your quiz…
      </h2>

      {/* Bouncing Dots */}
      <div className="flex gap-1.5 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-3 w-full max-w-[280px]">
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: i <= activeStep ? 1 : 0.3 }}
            className={`flex items-center gap-3 text-sm transition-colors ${
              i <= activeStep ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <span className="text-lg">{step.emoji}</span>
            <span className="font-medium">{step.label}</span>
            {i < activeStep && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto text-success"
              >
                ✓
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
