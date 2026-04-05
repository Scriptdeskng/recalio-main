"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { GraduationCap, Briefcase, Users } from "lucide-react";

const PERSONAS = [
  {
    Icon: GraduationCap,
    title: "Students",
    description: "Revise WAEC, JAMB, and uni material faster — paste your notes and drill on what matters.",
  },
  {
    Icon: Briefcase,
    title: "Professionals",
    description: "Stay sharp on your field in short daily sessions — quiz yourself during a commute or break.",
  },
  {
    Icon: Users,
    title: "Teachers & Groups",
    description: "Run shared quizzes and compare scores instantly — just share a link.",
  },
];

export default function WhoItsFor() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section className="py-10 md:py-24 px-5 bg-[#0b0d12]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="text-center mb-6 md:mb-12"
        >
          <span className="inline-block text-[10px] font-display font-bold text-[#2BD4BD] tracking-[0.15em] uppercase mb-2 px-3 py-1 rounded-full bg-[#2BD4BD]/[0.08]">
            Who it's for
          </span>
          <h2 className="font-display text-[1.4rem] md:text-3xl font-800 text-white tracking-tight">
            Every kind of learner
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-2.5 md:gap-5">
          {PERSONAS.map((p, i) => {
            const IconComp = p.Icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-[#14171f] rounded-xl p-3 md:p-5 border border-white/[0.04] border-t-2 border-t-[#2BD4BD]/30"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-[#2BD4BD]/10 text-[#2BD4BD]">
                  <IconComp size={16} strokeWidth={2.2} />
                </div>
                <h3 className="font-display text-[12px] md:text-sm font-bold text-white/90 mb-0.5">
                  {p.title}
                </h3>
                <p className="font-landing text-[#5a6478] text-[11px] md:text-[13px] leading-relaxed">
                  {p.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
