"use client";

import IndexPage from "@/pages/Index";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isPlayerAuthenticated } from "@/lib/player-auth";

export default function AppPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to landing page if not authenticated
    if (!isPlayerAuthenticated()) {
      router.push("/");
    }
  }, [router]);
  
  // Don't render the app if not authenticated
  if (!isPlayerAuthenticated()) {
    return null;
  }
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <IndexPage />
      </div>
    </ErrorBoundary>
  );
}
