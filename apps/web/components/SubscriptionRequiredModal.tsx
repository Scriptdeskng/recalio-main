"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ClientAction } from "@/lib/api/auth";

interface SubscriptionRequiredModalProps {
  open: boolean;
  onClose: () => void;
  clientAction?: ClientAction;
}

export default function SubscriptionRequiredModal({
  open,
  onClose,
  clientAction,
}: SubscriptionRequiredModalProps) {
  const handleSubscribe = () => {
    if (clientAction?.redirection_url) {
      window.location.href = clientAction.redirection_url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0f1117] border-white/[0.08] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-white">
            Subscription Required
          </DialogTitle>
          <DialogDescription className="text-white/60">
            You need an active subscription to play quizzes
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <p className="text-sm text-white/70">
            It looks like you don't have an active subscription. Subscribe now to continue
            enjoying unlimited quizzes and challenges.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleSubscribe}
              className="flex-1 bg-[#2BD4BD] hover:bg-[#24BFA8] text-[#0b0d12] font-semibold"
            >
              Subscribe Now
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-white/[0.1] text-white/80 hover:bg-white/[0.05] hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
