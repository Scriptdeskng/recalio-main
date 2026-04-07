"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Lightbulb, Trophy, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { subscriptionAPI } from "@/lib/api/subscriptions";
import { setPlayerAuth } from "@/lib/player-auth";
import { toast } from "sonner";

type PaymentState = "idle" | "mtn" | "paystack";
type SKU = "daily" | "weekly" | "monthly";
type PaymentMethod = "airtime" | "card";

const FEATURES = [
  {
    Icon: Brain,
    title: "Questions built around your topic",
    description: "Every session matches what you're actually studying.",
  },
  {
    Icon: Lightbulb,
    title: "Learn from explanations",
    description: "Every wrong answer shows you why — so you actually learn.",
  },
  {
    Icon: Trophy,
    title: "Challenge friends with one link",
    description: "Share your quiz. Compare scores instantly.",
  },
];

// Plan configuration with payment method availability
const SKUS: Array<{
  value: SKU;
  label: string;
  price: number;
  period: string;
  badge: string | null;
  allowedMethods: PaymentMethod[];
}> = [
  { 
    value: "daily", 
    label: "Daily", 
    price: 70, 
    period: "day", 
    badge: null,
    allowedMethods: ["airtime"]
  },
  { 
    value: "weekly", 
    label: "Weekly", 
    price: 200, 
    period: "week", 
    badge: null,
    allowedMethods: ["airtime", "card"]
  },
  { 
    value: "monthly", 
    label: "Monthly", 
    price: 600, 
    period: "month", 
    badge: "Best value",
    allowedMethods: ["card"]
  },
];

export default function SubscribePage() {
  const [state, setState] = useState<PaymentState>("idle");
  const [sku, setSku] = useState<SKU | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.classList.add("allow-scroll");
    
    // Prefill phone number from URL params if present
    if (searchParams) {
      const phoneParam = searchParams.get("phone");
      if (phoneParam) {
        setPhone(phoneParam);
      }
    }
    
    // Load Paystack inline script
    if (!document.querySelector('script[src*="paystack"]')) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v2/inline.js";
      document.body.appendChild(script);
    }
  }, []);

  // Get plans available for current payment method
  const availablePlans = state === "idle" 
    ? SKUS 
    : SKUS.filter(s => 
        state === "mtn" 
          ? s.allowedMethods.includes("airtime")
          : s.allowedMethods.includes("card")
      );

  const selectedSku = sku ? SKUS.find((s) => s.value === sku) : null;

  // Check if user already has an active subscription
  const checkExistingSubscription = async (msisdn: string): Promise<boolean> => {
    try {
      const result = await subscriptionAPI.getActiveSubscription(msisdn);
      if (result.has_active_subscription && result.subscription) {
        // User already has active subscription - log them in and redirect
        setPlayerAuth({
          msisdn: msisdn,
          telco: "MTN", // Default, actual telco is in backend
          hasActiveSubscription: true,
          subscriptionData: result.subscription
        });
        
        toast.success("You already have an active subscription! Redirecting...");
        setTimeout(() => {
          router.push("/main-app");
        }, 1000);
        return true;
      }
      return false;
    } catch (error) {
      // If check fails, allow payment to proceed
      console.error("Failed to check subscription:", error);
      return false;
    }
  };

  const handleMTN = async () => {
    if (!sku) return;
    
    // For MTN, we need phone number first
    const msisdn = prompt("Enter your MTN phone number (e.g., 08012345678):");
    if (!msisdn) return;
    
    const cleanedPhone = msisdn.replace(/\s+/g, "");
    
    // Check if user already has active subscription
    if (await checkExistingSubscription(cleanedPhone)) {
      return; // User already has subscription, redirected to main app
    }
    
    // Map plan period to IntelliHQ product IDs
    // TODO: Update these product IDs based on your IntelliHQ dashboard configuration
    const productIdMap: Record<SKU, string> = {
      daily: "daily_product_id",      // Replace with actual IntelliHQ product ID
      weekly: "weekly_product_id",    // Replace with actual IntelliHQ product ID
      monthly: "monthly_product_id"   // Replace with actual IntelliHQ product ID
    };
    
    const productId = productIdMap[sku];
    
    // Redirect to IntelliHQ for MTN airtime payment with selected product
    const redirectUrl = `http://api.intellihq.net/api/v1/service/1/test-web-promo/?marketer=bluemount&telco=MTN&antifraud=mfilter&product_id=${productId}`;
    window.location.href = redirectUrl;
  };

  const handlePaystack = async () => {
    if (!email || !phone || !sku) {
      toast.error("Please enter your phone number and email");
      return;
    }
    
    setLoading(true);

    // Clean phone number
    const cleanedPhone = phone.replace(/\s+/g, "");

    // Check if user already has active subscription
    if (await checkExistingSubscription(cleanedPhone)) {
      setLoading(false);
      return; // User already has subscription, redirected to main app
    }

    try {
      console.log("Initiating payment with:", {
        msisdn: cleanedPhone,
        email,
        plan_period: sku
      });

      // Call backend to initiate payment
      const paymentResponse = await subscriptionAPI.initiateCardPayment({
        msisdn: cleanedPhone,
        email: email,
        plan_period: sku
      });

      console.log("Payment response:", paymentResponse);

      if (!paymentResponse.success || !paymentResponse.authorization_url) {
        toast.error(paymentResponse.message || "Failed to initiate payment");
        setLoading(false);
        return;
      }

      // Use Paystack Popup SDK
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) {
        toast.error("Payment system not loaded. Please refresh and try again.");
        setLoading(false);
        return;
      }

      const selectedPlan = SKUS.find(s => s.value === sku)!;
      
      const handler = PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
        email: email,
        amount: selectedPlan.price * 100, // Convert to kobo
        currency: "NGN",
        ref: paymentResponse.reference,
        callback: async (response: { reference: string }) => {
          try {
            // Verify payment with backend
            const verifyResponse = await subscriptionAPI.verifyPayment(response.reference);
            
            if (verifyResponse.success && verifyResponse.subscription) {
              // Store player authentication - this logs them in
              setPlayerAuth({
                msisdn: cleanedPhone,
                telco: "MTN", // Default to MTN for card payments (actual telco detected on backend)
                hasActiveSubscription: true,
                subscriptionData: verifyResponse.subscription
              });
              
              toast.success("Subscription activated! Redirecting...");
              
              // Redirect to main app
              setTimeout(() => {
                router.push("/main-app");
              }, 500);
            } else {
              toast.error(verifyResponse.message || "Payment verification failed");
              setLoading(false);
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast.error("Failed to verify payment. Please contact support.");
            setLoading(false);
          }
        },
        onClose: () => {
          setLoading(false);
        },
      });
      
      handler?.openIframe();
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        stringified: JSON.stringify(error),
        type: typeof error
      });
      const errorMessage = error?.message || error?.toString() || "Failed to initiate payment";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <nav className="sticky top-0 z-50 bg-[#0b0d12]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-5 h-12 flex items-center justify-between">
          <a href="/">
            <img src="/staysharp-logo.png" alt="StaySharp" className="h-6" />
          </a>
        </div>
      </nav>

      <main className="max-w-sm mx-auto px-5 py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-[1.5rem] md:text-[2rem] font-extrabold text-white tracking-tight mb-2">
            Unlock full access
          </h1>
          <p className="text-[#5a6478] text-[12px] md:text-[14px] leading-relaxed">
            Plans from ₦70/day — billed to your airtime, cancel anytime
          </p>
        </motion.div>

        {/* Feature highlights */}
        <div className="space-y-2.5 mb-8">
          {FEATURES.map((f, i) => {
            const IconComp = f.Icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                className="flex items-start gap-3 bg-[#14171f] rounded-xl p-3.5 border border-white/[0.04]"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#2BD4BD]/[0.08] text-[#2BD4BD]">
                  <IconComp size={15} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-display text-[12px] md:text-[13px] font-bold text-white/90 mb-0.5">
                    {f.title}
                  </h3>
                  <p className="text-[10px] md:text-[11px] text-[#5a6478] leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Payment flow */}
        <AnimatePresence mode="wait">
          {state === "idle" ? (
            // Step 1: Choose payment method
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <button
                onClick={() => setState("mtn")}
                className="w-full font-display px-6 py-3 rounded-full bg-[#2BD4BD] text-[#0b0d12] hover:bg-[#24BFA8] transition-all shadow-[0_2px_16px_-2px_rgba(43,212,189,0.25)] flex flex-col items-center gap-1"
              >
                <span className="font-bold text-[14px] md:text-[15px] leading-none flex items-center gap-1.5">
                  Pay with airtime <ArrowRight size={15} />
                </span>
                <span className="text-[10px] font-normal text-[#0b0d12]/70 leading-none tracking-wide">
                  MTN only • Daily or Weekly plans
                </span>
              </button>
              <button
                onClick={() => setState("paystack")}
                className="w-full font-display px-6 py-3 rounded-full border-2 border-[#2BD4BD]/30 text-[#2BD4BD] hover:bg-[#2BD4BD]/[0.06] transition-all flex flex-col items-center gap-1"
              >
                <span className="font-bold text-[14px] md:text-[15px] leading-none flex items-center gap-1.5">
                  Pay by card <ArrowRight size={15} />
                </span>
                <span className="text-[10px] font-normal text-[#2BD4BD]/70 leading-none tracking-wide">
                  Debit/Credit card • Weekly or Monthly plans
                </span>
              </button>
              <a
                href="/signin"
                className="block text-center text-[10px] text-[#3a4255] hover:text-[#5a6478] transition-colors pt-2"
              >
                Already subscribed? Sign in →
              </a>
            </motion.div>
          ) : state === "mtn" ? (
            // Step 2a: Airtime flow - select plan and confirm
            <motion.div
              key="mtn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <button
                onClick={() => {
                  setState("idle");
                  setSku(null);
                }}
                className="text-[11px] text-[#5a6478] hover:text-white/70 transition-colors font-medium"
              >
                ← Back
              </button>
              
              <div>
                <p className="text-[10px] font-bold text-[#5a6478] tracking-[0.1em] uppercase mb-2">
                  Choose your plan
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availablePlans.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSku(s.value)}
                      className={`relative rounded-xl p-3 border text-left transition-all ${
                        sku === s.value
                          ? "border-[#2BD4BD]/40 bg-[#2BD4BD]/[0.06]"
                          : "border-white/[0.04] bg-[#14171f] hover:border-white/[0.08]"
                      }`}
                    >
                      {s.badge && (
                        <span className="absolute -top-2 right-2 text-[8px] font-bold text-[#0b0d12] bg-[#2BD4BD] px-2 py-0.5 rounded-full">
                          {s.badge}
                        </span>
                      )}
                      <p className="font-display text-[12px] font-bold text-white/90">
                        {s.label}
                      </p>
                      <p className="text-[10px] text-[#5a6478]">
                        ₦{s.price}/{s.period}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleMTN}
                disabled={!sku}
                className="w-full font-display font-bold text-[13px] md:text-[14px] px-6 py-3.5 rounded-full bg-[#2BD4BD] text-[#0b0d12] hover:bg-[#24BFA8] transition-all shadow-[0_4px_24px_-4px_rgba(43,212,189,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {sku ? `Pay ₦${selectedSku!.price} with airtime` : "Select a plan"} <ArrowRight size={15} />
              </button>
              
              <a
                href="/signin"
                className="block text-center text-[10px] text-[#3a4255] hover:text-[#5a6478] transition-colors pt-1"
              >
                Already subscribed? Sign in →
              </a>
            </motion.div>
          ) : (
            // Step 2b: Card flow - select plan, enter details, pay
            <motion.div
              key="paystack"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <button
                onClick={() => {
                  setState("idle");
                  setSku(null);
                  setPhone("");
                  setEmail("");
                }}
                className="text-[11px] text-[#5a6478] hover:text-white/70 transition-colors font-medium"
              >
                ← Back
              </button>
              
              <div>
                <p className="text-[10px] font-bold text-[#5a6478] tracking-[0.1em] uppercase mb-2">
                  Choose your plan
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availablePlans.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSku(s.value)}
                      className={`relative rounded-xl p-3 border text-left transition-all ${
                        sku === s.value
                          ? "border-[#2BD4BD]/40 bg-[#2BD4BD]/[0.06]"
                          : "border-white/[0.04] bg-[#14171f] hover:border-white/[0.08]"
                      }`}
                    >
                      {s.badge && (
                        <span className="absolute -top-2 right-2 text-[8px] font-bold text-[#0b0d12] bg-[#2BD4BD] px-2 py-0.5 rounded-full">
                          {s.badge}
                        </span>
                      )}
                      <p className="font-display text-[12px] font-bold text-white/90">
                        {s.label}
                      </p>
                      <p className="text-[10px] text-[#5a6478]">
                        ₦{s.price}/{s.period}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-[#5a6478] mb-1">
                    Your phone number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full rounded-xl bg-[#14171f] border border-white/[0.06] px-3.5 py-2.5 text-[13px] text-white placeholder:text-[#3a4255] focus:outline-none focus:border-[#2BD4BD]/30 transition-colors"
                  />
                  <p className="text-[9px] text-[#3a4255] mt-1">
                    We'll use this to send a verification code when you sign in
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[#5a6478] mb-1">
                    Your email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-[#14171f] border border-white/[0.06] px-3.5 py-2.5 text-[13px] text-white placeholder:text-[#3a4255] focus:outline-none focus:border-[#2BD4BD]/30 transition-colors"
                  />
                  <p className="text-[9px] text-[#3a4255] mt-1">
                    For your subscription confirmation
                  </p>
                </div>
              </div>
              
              <button
                onClick={handlePaystack}
                disabled={!email || !phone || !sku || loading}
                className="w-full font-display font-bold text-[13px] md:text-[14px] px-6 py-3.5 rounded-full bg-[#2BD4BD] text-[#0b0d12] hover:bg-[#24BFA8] transition-all shadow-[0_4px_24px_-4px_rgba(43,212,189,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Processing..."
                  : sku 
                    ? `Pay ₦${selectedSku!.price}/${selectedSku!.period} →`
                    : "Select a plan"}
              </button>
              
              <a
                href="/signin"
                className="block text-center text-[10px] text-[#3a4255] hover:text-[#5a6478] transition-colors pt-1"
              >
                Already subscribed? Sign in →
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
