import { HistoryList } from "@/components/app/history-list";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <div className="h-full">
        <HistoryList />
      </div>
    </ProtectedRoute>
  );
}
