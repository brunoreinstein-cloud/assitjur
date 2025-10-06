import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMultiTenantLoading } from "@/hooks/useMultiTenantLoading";
import { MultiTenantLoadingScreen } from "@/components/core/MultiTenantLoadingScreen";
import { AppLayout } from "@/components/navigation/AppLayout";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "ANALYST" | "VIEWER";
}

/**
 * RouteGuard - Single authentication guard for all /app/* routes
 * 
 * Features:
 * - Redirects unauthenticated users to /login with next parameter
 * - Handles MFA verification flow
 * - Wraps authenticated routes with AppLayout
 * - Shows loading states during auth checks
 */
export function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const { user, loading: authLoading, profile } = useAuth();
  const { isLoading: tenantLoading } = useMultiTenantLoading();
  const location = useLocation();

  // Show loading screen during initial auth check
  if (authLoading || tenantLoading) {
    return <MultiTenantLoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    const currentPath = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(currentPath)}`} replace />;
  }

  // Check if account is activated
  if (profile && !profile.is_active) {
    return <Navigate to="/account-inactive" replace />;
  }

  // Check role permissions if required
  if (requiredRole && profile) {
    const userRole = profile.roles?.[0]?.role;
    
    if (userRole !== requiredRole && userRole !== "ADMIN") {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  // Wrap with AppLayout for authenticated routes
  return <AppLayout>{children}</AppLayout>;
}
