import { useState, useEffect } from "react";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0b0d12]/90 backdrop-blur-xl border-b border-white/[0.04]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-5 h-12 flex items-center justify-between">
        <a href="/">
          <img
            src="/staysharp-logo.png"
            alt="StaySharp"
            className="h-6"
          />
        </a>
        <a
          href="/app"
          className="text-[11px] font-semibold font-display px-4 py-1.5 rounded-full bg-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:text-white transition-all border border-white/[0.06]"
        >
          Subscribe
        </a>
      </div>
    </nav>
  );
}
