"use client";

import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WhoItsFor from "@/components/landing/WhoItsFor";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isPlayerAuthenticated } from "@/lib/player-auth";

export default function LandingPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is already authenticated and redirect to main app
    if (isPlayerAuthenticated()) {
      router.push("/main-app");
      return;
    }
    
    document.documentElement.classList.add("allow-scroll");
    return () => {
      document.documentElement.classList.remove("allow-scroll");
    };
  }, [router]);

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
