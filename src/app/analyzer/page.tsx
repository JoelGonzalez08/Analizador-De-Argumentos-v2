import { ArgumentAnalyzer } from "@/components/app/argument-analyzer";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AnalyzerPage() {
  return (
    <ProtectedRoute>
      <div className="h-full">
        <ArgumentAnalyzer />
      </div>
    </ProtectedRoute>
  );
}
