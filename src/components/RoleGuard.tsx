import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCurrentProfile, homePathForRole, type UserRole } from "@/hooks/use-current-profile";
import { usePushSync } from "@/hooks/use-push-notifications";

/**
 * Route guard: requires a signed-in user with one of `allow` roles and finished onboarding.
 * Data is still protected by RLS; this only keeps users out of screens that aren't theirs.
 */
export default function RoleGuard({ allow, children }: { allow: UserRole[]; children: React.ReactNode }) {
  const { session, profile, isLoading } = useCurrentProfile();
  const location = useLocation();
  usePushSync(profile?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // Signed in but no profile row: send to the landing page (the login page would bounce back here).
  if (!profile) return <Navigate to="/" replace />;

  if (!profile.onboarding_done && profile.role !== "admin") {
    return <Navigate to={profile.role === "client" ? "/onboarding/klient" : "/onboarding/trener"} replace />;
  }

  if (!allow.includes(profile.role)) return <Navigate to={homePathForRole(profile.role)} replace />;

  return <>{children}</>;
}
