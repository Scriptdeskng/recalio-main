"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authAPI } from "@/lib/api/auth";
import { useToast } from "@/hooks/use-toast";
import { setPlayerAuth } from "@/lib/player-auth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthStep = "phone" | "otp";

// Normalize phone number to Nigerian format (234XXXXXXXXXX)
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // Handle different formats
  if (cleaned.startsWith("0")) {
    // 0801234567 -> 2348012345678
    cleaned = "234" + cleaned.substring(1);
  } else if (cleaned.startsWith("234")) {
    // Already in correct format
    cleaned = cleaned;
  } else if (cleaned.length === 10) {
    // 8012345678 -> 2348012345678
    cleaned = "234" + cleaned;
  }
  
  return cleaned;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>("phone");
  const [telco, setTelco] = useState<"MTN" | "GLO">("MTN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [retryCountdown, setRetryCountdown] = useState(0);
  const { toast } = useToast();

  // Countdown timer for retry button
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const normalized = normalizePhoneNumber(phoneNumber);
      setNormalizedPhone(normalized);
      
      await authAPI.sendOTP({
        msisdn: normalized,
        telco: telco,
      });

      toast({
        title: "OTP Sent",
        description: "An OTP has been sent to your phone",
      });
      
      setStep("otp");
      setRetryCountdown(45); // Start 45 second countdown
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      toast({
        title: "Error",
        description: "Please enter the OTP code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.verifyOTP({
        msisdn: normalizedPhone,
        otp: otp,
      });

      if (result.success) {
        // Store authentication data with TTL
        setPlayerAuth({
          msisdn: normalizedPhone,
          telco: telco,
          hasActiveSubscription: result.data.has_active_subscription,
          subscriptionData: result.data.active_subscription,
        });
        
        toast({
          title: "Success",
          description: result.message || "Authentication successful",
        });
        
        // Reset and close modal
        resetForm();
        onClose();
        
        // Redirect to main app after successful authentication
        window.location.href = "/main-app";
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setOtp("");
    setStep("phone");
    setRetryCountdown(0); // Reset countdown
  };

  const resetForm = () => {
    setStep("phone");
    setPhoneNumber("");
    setOtp("");
    setNormalizedPhone("");
    setTelco("MTN");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-[#0f1117] border-white/[0.08] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-white">
            {step === "phone" ? "Sign In to Play" : "Verify OTP"}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {step === "phone"
              ? "Enter your mobile network provider and phone number to continue"
              : "Enter the OTP code sent to your phone"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {step === "phone" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Mobile Network Provider
                </label>
                <Select value={telco} onValueChange={(value) => setTelco(value as "MTN" | "GLO")}>
                  <SelectTrigger className="bg-white/[0.05] border-white/[0.1] text-white">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1c24] border-white/[0.1]">
                    <SelectItem value="MTN" className="text-white hover:bg-white/[0.05]">MTN</SelectItem>
                    <SelectItem value="GLO" className="text-white hover:bg-white/[0.05]">GLO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="0801234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40"
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-[#2BD4BD] hover:bg-[#24BFA8] text-[#0b0d12] font-semibold"
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  OTP Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40"
                  disabled={loading}
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="flex-1 bg-[#2BD4BD] hover:bg-[#24BFA8] text-[#0b0d12] font-semibold"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
                <Button
                  onClick={handleRetry}
                  disabled={loading || retryCountdown > 0}
                  variant="outline"
                  className="border-white/[0.1] text-white/80 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                >
                  {retryCountdown > 0 ? `${retryCountdown}s` : "Retry"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
