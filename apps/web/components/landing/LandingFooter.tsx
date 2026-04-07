"use client";

export default function LandingFooter() {
  return (
    <footer className="py-6 md:py-8 px-5 bg-[#0a0c10] border-t border-white/[0.03]">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-2.5 text-center">
        <img
          src="/staysharp-logo.png"
          alt="StaySharp"
          className="h-5 opacity-60"
        />
        <p className="text-[10px] text-[#3a4255]">
          Study smarter. Remember more.
        </p>
        <div className="flex items-center gap-3 text-[9px] text-[#252a33]">
          <span>© 2026 StaySharp. All rights reserved.</span>
          <a href="/signin" className="text-[#3a4255] hover:text-[#5a6478] transition-colors">
            Sign in
          </a>
        </div>
      </div>
    </footer>
  );
}
