import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useManagerProfile } from "@/modules/manager/hooks/useManagerProfile";
import { GoogleProfileSetup } from "@/modules/auth/components/GoogleProfileSetup";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ResetPasswordFromEmail } from "@/modules/auth/components/ResetPasswordFromEmail";

interface ProtectedRouteProps { children: React.ReactNode; }

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const { data: profile, isLoading: profileLoading } = useManagerProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [setupDone, setSetupDone] = useState(false);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <span className="font-display text-primary-foreground text-sm font-bold">T</span>
          </div>
          <p className="text-xs text-muted-foreground font-body">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Check role from user metadata (set at creation — no DB query needed)
  // Admins have role="admin" in raw_user_meta_data
  const userRole = user.user_metadata?.role;
  if (userRole === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Password recovery
  if (isPasswordRecovery) {
    return (
      <ResetPasswordFromEmail
        onComplete={() => {
          clearPasswordRecovery();
          navigate("/dashboard", { replace: true });
        }}
      />
    );
  }

  // Google first-time setup
  const isGoogleUser = user.app_metadata?.provider === "google";
  const profileSetupNeeded = isGoogleUser && !setupDone && !profile?.full_name && location.pathname !== "/settings";

  if (profileSetupNeeded) {
    return (
      <GoogleProfileSetup
        userName={user.user_metadata?.full_name || user.email?.split("@")[0] || "Manager"}
        userEmail={user.email || ""}
        onComplete={() => {
          setSetupDone(true);
          qc.invalidateQueries({ queryKey: ["manager-profile"] });
        }}
      />
    );
  }

  return <>{children}</>;
}
