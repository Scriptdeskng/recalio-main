import IndexPage from "@/pages/Index";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function AppPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <IndexPage />
      </div>
    </ErrorBoundary>
  );
}
