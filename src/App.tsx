import React, { Suspense, lazy } from "react";
import { MotionConfig } from "framer-motion";
import { DEFAULT_TRANSITION } from "@/config/motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConsentProvider } from "@/hooks/useConsent";
import ConsentDialog from "@/components/privacy/ConsentDialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider as AuthContextProvider } from "@/hooks/useAuth";
import { AuthProvider as SupabaseAuthProvider } from "@/providers/AuthProvider";
import AuthGuard from "@/components/AuthGuard";
import { AppLayout } from "@/components/navigation/AppLayout";
import { ErrorBoundary } from "@/components/core/ErrorBoundary";
import AdminRoutes from "./routes/AdminRoutes";
import { FooterLegal } from "@/components/common/FooterLegal";
import { ServiceHealthProvider } from "@/hooks/useServiceHealth";
import { StatusBanner } from "@/components/common/StatusBanner";
import SessionExpiredModal from "@/components/auth/SessionExpiredModal";
import FeatureFlagGuard from "@/components/FeatureFlagGuard";
import { MaintenanceBanner } from "@/components/common/MaintenanceBanner";
import { useMaintenance } from "@/hooks/useMaintenance";
import { FeatureFlagProvider } from "@/hooks/useFeatureFlag";

const MapaPage = lazy(() => import("./pages/MapaPage"));
const PublicHome = lazy(() => import("./pages/PublicHome"));
const About = lazy(() => import("./pages/About"));
const Beta = lazy(() => import("./pages/Beta"));
const Login = lazy(() => import("./pages/Login"));
const Reset = lazy(() => import("./pages/Reset"));
const ResetConfirm = lazy(() => import("./pages/ResetConfirm"));
const ResetPasswordPage = lazy(() => import("./routes/reset-password"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const PortalTitular = lazy(() => import("./pages/PortalTitular"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DemoMapaTestemunhas = lazy(() => import("./pages/DemoMapaTestemunhas"));
const TemplatePage = lazy(() => import("./pages/TemplatePage"));
const ReportDemo = lazy(() => import("./pages/ReportDemo"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const LGPD = lazy(() => import("./pages/LGPD"));
const TwoFactorSetup = lazy(() => import("./pages/TwoFactorSetup"));
const ServerError = lazy(() => import("./pages/ServerError"));
const Status = lazy(() => import("./pages/Status"));

function AppRoutes() {
  const maintenance = useMaintenance();

  if (maintenance) {
    return (
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/status" element={<Status />} />
        <Route path="*" element={<Navigate to="/status" replace />} />
      </Routes>
    );
  }

  return (
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicHome />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/beta" element={<Beta />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/reset/confirm" element={<ResetConfirm />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/portal-titular" element={<PortalTitular />} />
        <Route path="/import/template" element={<TemplatePage />} />
        <Route path="/demo/mapa-testemunhas" element={<DemoMapaTestemunhas />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/termos" element={<TermsOfUse />} />
        <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
        <Route path="/termos-de-uso" element={<TermsOfUse />} />
        <Route path="/lgpd" element={<LGPD />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/status" element={<Status />} />

        {/* Protected routes with app layout */}
        <Route
          element={
            <AuthGuard>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<div className="p-4">Carregando...</div>}>
                    <Outlet />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </AuthGuard>
          }
        >
          <Route path="/dashboard" element={<Navigate to="/mapa" replace />} />
          <Route path="/mapa" element={<MapaPage />} />
          <Route path="/mapa-testemunhas" element={<MapaPage />} />
          <Route path="/dados" element={<Navigate to="/mapa" replace />} />
          <Route path="/dados/mapa" element={<Navigate to="/mapa" replace />} />
          {/* Redirect deprecated chat route to mapa-testemunhas */}
          <Route path="/chat" element={<Navigate to="/mapa-testemunhas?view=chat" replace />} />
          <Route path="/app/chat" element={<Navigate to="/mapa-testemunhas?view=chat" replace />} />

          {/* Admin routes */}
          <AdminRoutes />
          <Route path="/import" element={<Navigate to="/admin/base-import" replace />} />
          <Route
            path="/relatorio"
            element={
              <FeatureFlagGuard flag="advanced-report">
                <ReportDemo />
              </FeatureFlagGuard>
            }
          />
          <Route path="/account/2fa" element={<TwoFactorSetup />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <MotionConfig reducedMotion="user" transition={DEFAULT_TRANSITION}>
      <QueryClientProvider client={queryClient}>
        <ServiceHealthProvider>
          <AuthContextProvider>
            <FeatureFlagProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <SessionExpiredModal />
                <ConsentProvider>
                  <ConsentDialog />
                  <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <SupabaseAuthProvider>
                    <div className="min-h-screen flex flex-col">
                      <MaintenanceBanner />
                      <StatusBanner />
                      <main id="conteudo" className="flex-1">
                        <Suspense fallback={<div className="p-4">Carregando...</div>}>
                          <AppRoutes />
                        </Suspense>
                      </main>
                      <FooterLegal />
                    </div>
                  </SupabaseAuthProvider>
                </BrowserRouter>
              </ConsentProvider>
              </TooltipProvider>
            </FeatureFlagProvider>
          </AuthContextProvider>
        </ServiceHealthProvider>
      </QueryClientProvider>
    </MotionConfig>
  </ErrorBoundary>
);

export default App;
