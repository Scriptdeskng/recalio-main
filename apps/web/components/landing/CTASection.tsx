"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section
      id="subscribe"
      className="relative py-10 md:py-24 px-5 bg-[#0b0d12] overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#2BD4BD]/[0.03] blur-[100px] pointer-events-none" />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45 }}
        className="relative max-w-sm mx-auto text-center"
      >
        <h2 className="font-display text-[1.3rem] md:text-[2rem] font-800 text-white mb-2.5 tracking-tight">
          Ready to start with{" "}
          <span className="text-[#2BD4BD]">StaySharp</span>?
        </h2>
        <p className="text-[#5a6478] text-[12px] md:text-[14px] mb-5 leading-relaxed">
          Available on MTN Nigeria. Subscribe from your airtime and start
          quizzing in seconds. Cancel anytime.
        </p>

        <a
          href="/main-app"
          className="inline-flex items-center justify-center w-full sm:w-auto font-display font-bold text-[12px] md:text-[14px] px-8 py-3 rounded-full bg-[#2BD4BD] text-[#0b0d12] hover:bg-[#24BFA8] transition-all shadow-[0_4px_24px_-4px_rgba(43,212,189,0.3)]"
        >
          Subscribe now →
        </a>
      </motion.div>
    </section>
  );
}
