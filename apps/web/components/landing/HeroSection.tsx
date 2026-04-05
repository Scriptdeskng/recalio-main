"use client";

import { motion } from "framer-motion";
import HeroDemo from "./HeroDemo";

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-4 md:pt-28 md:pb-14 px-5 overflow-hidden">
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#2BD4BD]/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center md:text-left max-w-lg mx-auto md:mx-0 mb-4 md:mb-0 md:max-w-none md:grid md:grid-cols-2 md:gap-10 md:items-center"
        >
          <div>
            <h1 className="font-display text-[1.6rem] md:text-[2.8rem] lg:text-[3.2rem] font-800 leading-[1.12] tracking-[-0.025em] text-white mb-3 md:mb-4">
              Turn any topic into a{" "}
              <span className="relative inline-block">
                <span className="text-[#2BD4BD]">quiz</span>
                <motion.span
                  className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-[#2BD4BD]/60"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                  style={{ transformOrigin: "left" }}
                />
              </span>
              <br />
              in seconds.
            </h1>
            <p className="text-[#7a8599] text-[0.82rem] md:text-[1rem] leading-[1.7] mb-4 md:mb-6 max-w-[24rem] mx-auto md:mx-0">
              Create personalised quizzes from any topic or your own notes.
              Learn faster, remember more, and challenge friends.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
              <a
                href="/main-app"
                className="inline-flex items-center font-display font-semibold text-[12px] md:text-[13px] px-5 py-2.5 md:px-6 md:py-3 rounded-full bg-[#2BD4BD] text-[#0b0d12] hover:bg-[#24BFA8] transition-colors shadow-[0_4px_20px_-4px_rgba(43,212,189,0.3)]"
              >
                Subscribe now →
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center font-display font-semibold text-[12px] md:text-[13px] px-5 py-2.5 md:px-6 md:py-3 rounded-full border border-white/[0.08] text-white/60 hover:text-white/90 hover:border-white/[0.15] transition-all"
              >
                How it works
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="flex items-center justify-center mt-6 md:mt-0"
          >
            <HeroDemo />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
