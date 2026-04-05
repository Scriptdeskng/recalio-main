"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface AutoAdvanceRingProps {
  duration: number;
  onComplete: () => void;
}

export default function AutoAdvanceRing({ duration, onComplete }: AutoAdvanceRingProps) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const handleComplete = () => {
    onCompleteRef.current();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-1"
    >
      <svg width="44" height="44" viewBox="0 0 44 44" className="rotate-[-90deg]">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="hsl(var(--card))" strokeWidth="3" />
        <motion.circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration, ease: "linear" }}
          onAnimationComplete={handleComplete}
        />
      </svg>
    </motion.div>
  );
}
