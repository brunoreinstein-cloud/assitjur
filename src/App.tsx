import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConsentProvider } from "@/hooks/useConsent";
import ConsentDialog from "@/components/privacy/ConsentDialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import { AppLayout } from "@/components/navigation/AppLayout";
import { ErrorBoundary } from "@/components/core/ErrorBoundary";
import AdminRoutes from "./routes/AdminRoutes";
import { FooterLegal } from "@/components/common/FooterLegal";

const MapaPage = lazy(() => import("./pages/MapaPage"));
const PublicHome = lazy(() => import("./pages/PublicHome"));
const About = lazy(() => import("./pages/About"));
const Beta = lazy(() => import("./pages/Beta"));
const Login = lazy(() => import("./pages/Login"));
const Reset = lazy(() => import("./pages/Reset"));
const ResetConfirm = lazy(() => import("./pages/ResetConfirm"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const PortalTitular = lazy(() => import("./pages/PortalTitular"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DemoMapaTestemunhas = lazy(() => import("./pages/DemoMapaTestemunhas"));
const TemplatePage = lazy(() => import("./pages/TemplatePage"));
const ReportDemo = lazy(() => import("./pages/ReportDemo"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const LGPD = lazy(() => import("./pages/LGPD"));

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConsentProvider>
            <ConsentDialog />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <div className="min-h-screen flex flex-col">
                <div className="flex-1">
                  <Suspense fallback={<div className="p-4">Carregando...</div>}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<PublicHome />} />
                      <Route path="/sobre" element={<About />} />
                      <Route path="/beta" element={<Beta />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/reset" element={<Reset />} />
                      <Route path="/reset/confirm" element={<ResetConfirm />} />
                      <Route path="/verify-otp" element={<VerifyOtp />} />
                      <Route path="/portal-titular" element={<PortalTitular />} />
                      <Route path="/import/template" element={<TemplatePage />} />
                      <Route path="/demo/mapa-testemunhas" element={<DemoMapaTestemunhas />} />
                      <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
                      <Route path="/termos-de-uso" element={<TermsOfUse />} />
                      <Route path="/lgpd" element={<LGPD />} />

                      {/* Protected routes with app layout */}
                      <Route
                        path="/*"
                        element={
                          <AuthGuard>
                            <AppLayout>
                              <ErrorBoundary>
                                <Suspense fallback={<div className="p-4">Carregando...</div>}>
                                  <Routes>
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
                                    <Route path="/relatorio" element={<ReportDemo />} />

                                    <Route path="*" element={<NotFound />} />
                                  </Routes>
                                </Suspense>
                              </ErrorBoundary>
                            </AppLayout>
                          </AuthGuard>
                        }
                      />
                    </Routes>
                  </Suspense>
                </div>
                <FooterLegal />
              </div>
            </BrowserRouter>
          </ConsentProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
