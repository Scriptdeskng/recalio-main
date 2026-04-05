"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, FileText, Lightbulb, Trophy, Zap } from "lucide-react";

const FEATURES = [
  {
    Icon: Brain,
    title: "Quizzes that match what you're studying",
    description: "Every session is built around your topic and difficulty level — no generic questions.",
  },
  {
    Icon: FileText,
    title: "Turn lecture notes into practice questions",
    description: "Paste any text and get a quiz in seconds. Perfect for exam prep.",
  },
  {
    Icon: Lightbulb,
    title: "See why an answer was wrong",
    description: "Every question includes a clear explanation so you actually learn, not just guess.",
  },
  {
    Icon: Trophy,
    title: "Challenge friends with one link",
    description: "Share a quiz link. Everyone plays the same questions — scores compared instantly.",
  },
  {
    Icon: Zap,
    title: "Build momentum with XP",
    description: "Earn XP for every correct answer. Track your progress and stay motivated.",
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section className="relative py-10 md:py-20 px-5 bg-[#0b0d12] overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative max-w-4xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="inline-block text-[9px] font-bold text-[#2BD4BD]/70 tracking-[0.15em] uppercase mb-2 px-2.5 py-0.5 rounded-full bg-[#2BD4BD]/[0.06] border border-[#2BD4BD]/[0.08]">
            Features
          </span>
          <h2 className="font-display text-[1.25rem] md:text-[1.8rem] font-800 text-white tracking-tight">
            Built for real learning
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3.5">
          {FEATURES.map((f, i) => {
            const IconComp = f.Icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`group bg-[#14171f] rounded-xl p-3 md:p-4 border border-white/[0.04] hover:border-[#2BD4BD]/10 transition-all ${
                  i === 4 ? "col-span-2 md:col-span-1" : ""
                }`}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 bg-[#2BD4BD]/[0.08] text-[#2BD4BD] group-hover:bg-[#2BD4BD]/[0.12] transition-colors">
                  <IconComp size={14} strokeWidth={2.2} />
                </div>
                <h3 className="font-display text-[11px] md:text-[13px] font-bold text-white/90 mb-0.5 group-hover:text-[#2BD4BD] transition-colors">
                  {f.title}
                </h3>
                <p className="text-[10px] md:text-[11px] text-[#5a6478] leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
