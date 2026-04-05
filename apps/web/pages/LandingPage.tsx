"use client";

import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WhoItsFor from "@/components/landing/WhoItsFor";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add("allow-scroll");
    return () => {
      document.documentElement.classList.remove("allow-scroll");
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0d12] text-[#e8eaed] font-landing antialiased">
      <LandingNav />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <WhoItsFor />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
