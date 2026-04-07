"use client";

import IndexPage from "@/pages/Index";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isPlayerAuthenticated } from "@/lib/player-auth";

export default function AppPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Mark as client-side mounted
    setIsClient(true);
    
    // Check authentication only on client-side
    const authenticated = isPlayerAuthenticated();
    setIsAuthenticated(authenticated);
    
    // Redirect to landing page if not authenticated
    if (!authenticated) {
      router.push("/");
    }
  }, [router]);
  
  // During SSR or before client hydration, show nothing to avoid mismatch
  if (!isClient) {
    return null;
  }
  
  // After hydration, check if authenticated
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <IndexPage />
      </div>
    </ErrorBoundary>
  );
}
