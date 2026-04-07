"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authAPI } from "@/lib/api/auth";
import { toast } from "sonner";

type Step = "phone" | "otp" | "result";
type ResultStatus = "active" | "grace" | "suspended" | "churned" | "not_found";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [last4, setLast4] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultStatus, setResultStatus] = useState<ResultStatus | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = useCallback(async () => {
    if (!phone.trim()) {
      setError("Enter your phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const cleaned = phone.replace(/\s+/g, "");
      
      // Send OTP via API (MTN network)
      const result = await authAPI.sendOTP({
        msisdn: cleaned,
        telco: "MTN"
      });
      
      if (result.success) {
        setLast4(cleaned.slice(-4));
        setCountdown(30);
        setStep("otp");
        toast.success("Code sent successfully!");
      } else {
        setError("Failed to send code. Please try again.");
      }
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setError(err.message || "Failed to send code. Please try again.");
      toast.error("Failed to send code");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleResend = () => {
    setOtp("");
    setError("");
    handleSendOtp();
  };

  const handleVerify = useCallback(async () => {
    if (otp.length < 4) {
      setError("Enter the 4-digit code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const cleaned = phone.replace(/\s+/g, "");
      
      // Verify OTP via API
      const result = await authAPI.verifyOTP({
        msisdn: cleaned,
        otp: otp
      });
      
      if (result.success && result.data) {
        // Check subscription status
        if (!result.data.has_any_subscription) {
          setResultStatus("not_found");
          setStep("result");
          return;
        }
        
        if (result.data.has_active_subscription && result.data.active_subscription) {
          const subStatus = result.data.active_subscription.sub_status;
          
          // Store auth info in session storage
          sessionStorage.setItem("staysharp_auth", JSON.stringify({
            msisdn: cleaned,
            subscription_status: subStatus,
            has_active_subscription: true
          }));
          
          // Navigate to main app
          toast.success("Sign in successful!");
          router.push("/main-app");
        } else {
          // Has subscription but not active (suspended, churned, etc)
          const subscription = result.data.active_subscription;
          if (subscription) {
            const status = subscription.sub_status.toLowerCase();
            if (status.includes("suspend")) {
              setResultStatus("suspended");
            } else if (status.includes("churn")) {
              setResultStatus("churned");
            } else {
              setResultStatus("grace");
            }
          } else {
            setResultStatus("not_found");
          }
          setStep("result");
        }
      } else {
        setError("Invalid code. Please try again.");
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      if (err.message.includes("expired")) {
        setError("Code expired. Resend to get a new one.");
      } else if (err.message.includes("invalid") || err.message.includes("incorrect")) {
        setError("That code isn't right. Try again.");
      } else {
        setError("Verification failed. Please try again.");
      }
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  }, [otp, phone, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm space-y-6 mx-auto"
            >
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold font-display text-foreground">
                  Sign in to StaySharp
                </h1>
                <p className="text-sm text-muted-foreground font-body">
                  Enter your phone number to get started
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Phone number (MTN only)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full h-12 px-3 rounded-xl bg-input border border-border text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {error && (
                  <p className="text-xs text-destructive font-body">{error}</p>
                )}
                <button
                  onClick={handleSendOtp}
                  disabled={loading || !phone.trim()}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold font-display text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send code →"
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground font-body">
                Don't have an account?{" "}
                <a
                  href="/subscribe"
                  className="text-primary hover:underline"
                >
                  Subscribe
                </a>
              </p>
            </motion.div>
          )}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm space-y-6 mx-auto"
            >
              <button
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold font-display text-foreground">
                  Enter your code
                </h1>
                <p className="text-sm text-muted-foreground font-body">
                  We sent a code to •••{last4}
                </p>
              </div>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-14 h-14 text-xl bg-input border-border text-foreground" />
                    <InputOTPSlot index={1} className="w-14 h-14 text-xl bg-input border-border text-foreground" />
                    <InputOTPSlot index={2} className="w-14 h-14 text-xl bg-input border-border text-foreground" />
                    <InputOTPSlot index={3} className="w-14 h-14 text-xl bg-input border-border text-foreground" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && (
                <p className="text-xs text-destructive text-center font-body">
                  {error}
                </p>
              )}
              <button
                onClick={handleVerify}
                disabled={loading || otp.length < 4}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold font-display text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify →"
                )}
              </button>
              {countdown > 0 ? (
                <p className="text-center text-xs text-muted-foreground font-body">
                  Resend in {countdown}s
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="w-full text-center text-xs text-primary hover:underline font-body"
                >
                  Didn't get a code? Resend →
                </button>
              )}
            </motion.div>
          )}
          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm space-y-6 text-center mx-auto"
            >
              {resultStatus === "suspended" && (
                <>
                  <div className="text-4xl">⚠️</div>
                  <h2 className="text-xl font-bold font-display text-foreground">
                    Subscription paused
                  </h2>
                  <p className="text-sm text-muted-foreground font-body">
                    Your subscription needs renewal to continue.
                  </p>
                  <a
                    href="/subscribe"
                    className="inline-block w-full h-12 leading-[3rem] rounded-xl bg-primary text-primary-foreground font-semibold font-display text-sm text-center"
                  >
                    Renew subscription →
                  </a>
                </>
              )}
              {resultStatus === "churned" && (
                <>
                  <div className="text-4xl">👋</div>
                  <h2 className="text-xl font-bold font-display text-foreground">
                    Subscription ended
                  </h2>
                  <p className="text-sm text-muted-foreground font-body">
                    Re-subscribe to pick up where you left off.
                  </p>
                  <a
                    href="/subscribe"
                    className="inline-block w-full h-12 leading-[3rem] rounded-xl bg-primary text-primary-foreground font-semibold font-display text-sm text-center"
                  >
                    Subscribe again →
                  </a>
                </>
              )}
              {resultStatus === "not_found" && (
                <>
                  <div className="text-4xl">🔍</div>
                  <h2 className="text-xl font-bold font-display text-foreground">
                    No subscription found
                  </h2>
                  <p className="text-sm text-muted-foreground font-body">
                    We couldn't find an active subscription for this number.
                  </p>
                  <a
                    href="/subscribe"
                    className="inline-block w-full h-12 leading-[3rem] rounded-xl bg-primary text-primary-foreground font-semibold font-display text-sm text-center"
                  >
                    Subscribe now →
                  </a>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
