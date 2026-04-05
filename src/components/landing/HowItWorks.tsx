import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, Sparkles, Trophy } from "lucide-react";

const STEPS = [
  {
    title: "Pick a topic or paste notes",
    description: "Type any subject — or paste your lecture notes, past questions, or study material.",
    Icon: FileText,
    tint: "bg-[#2BD4BD]/10 text-[#2BD4BD]",
  },
  {
    title: "Get fresh questions instantly",
    description: "StaySharp creates a personalised quiz matched to your content and difficulty level.",
    Icon: Sparkles,
    tint: "bg-[#f5a623]/10 text-[#f5a623]",
  },
  {
    title: "Learn and challenge friends",
    description: "Answer questions, see explanations, earn XP — then share a link so friends can try the same quiz.",
    Icon: Trophy,
    tint: "bg-[#2BD4BD]/10 text-[#2BD4BD]",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section id="how-it-works" className="py-10 md:py-24 px-5 bg-[#0e1118]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="text-center mb-6 md:mb-12"
        >
          <span className="inline-block text-[10px] font-display font-bold text-[#2BD4BD] tracking-[0.15em] uppercase mb-2 px-3 py-1 rounded-full bg-[#2BD4BD]/[0.08]">
            How it works
          </span>
          <h2 className="font-display text-[1.4rem] md:text-3xl font-800 text-white tracking-tight">
            From notes to quiz in seconds
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-2.5 md:gap-5">
          {STEPS.map((step, i) => {
            const IconComp = step.Icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-start gap-3 p-3 md:p-5 rounded-xl bg-[#14171f] border border-white/[0.04]"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${step.tint}`}
                >
                  <IconComp size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-display text-[12px] md:text-sm font-bold text-white/90 mb-0.5">
                    {step.title}
                  </h3>
                  <p className="font-landing text-[#5a6478] text-[11px] md:text-[13px] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
