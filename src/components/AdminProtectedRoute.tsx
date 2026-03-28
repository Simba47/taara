import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAdminStore } from "@/stores/adminStore";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, initialized, initialize } = useAdminStore();

  useEffect(() => { if (!initialized) initialize(); }, [initialized, initialize]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center animate-pulse">
          <span className="font-display text-primary-foreground text-sm font-bold">T</span>
        </div>
      </div>
    );
  }
  if (!user)    return <Navigate to="/admin/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return <>{children}</>;
}
