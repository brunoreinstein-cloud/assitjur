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

const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const ImportBase = lazy(() => import("./pages/admin/ImportBase"));
const TemplatePage = lazy(() => import("./pages/TemplatePage"));
const Versions = lazy(() => import("./pages/admin/Versions"));
const Organization = lazy(() => import("./pages/admin/Organization"));

const SystemConfig = lazy(() => import("./pages/admin/SystemConfig"));
const Compliance = lazy(() => import("./pages/admin/Compliance"));
const MarketingCompliance = lazy(() => import("./pages/admin/MarketingCompliance"));
const DataRetention = lazy(() => import("./pages/admin/DataRetention"));
const AuditPanel = lazy(() => import("./pages/admin/AuditPanel"));
const OpenAI = lazy(() => import("./pages/admin/OpenAI"));
const OpenAIKeys = lazy(() => import("./pages/admin/openai/Keys"));
const OpenAIModels = lazy(() => import("./pages/admin/openai/Models"));
const PromptStudio = lazy(() => import("./pages/admin/openai/PromptStudio"));
const OpenAIPlayground = lazy(() => import("./pages/admin/openai/Playground"));
const Logs = lazy(() => import("./pages/admin/Logs"));
const ReportDemo = lazy(() => import("./pages/ReportDemo"));
const ValidationTest = lazy(() => import("./pages/admin/ValidationTest"));

// Data Explorer components
const BaseRedirect = lazy(() => import("./pages/admin/base/index"));
const BaseLayout = lazy(() => import("./pages/admin/base/BaseLayout"));
const ProcessosTable = lazy(() => import("./pages/admin/base/ProcessosTable"));
const TestemunhasTable = lazy(() => import("./pages/admin/base/TestemunhasTable"));

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
                                <Route path="/admin" element={<Dashboard />} />
                                <Route path="/admin/analytics" element={<Analytics />} />
                                <Route path="/admin/ia" element={<OpenAI />} />
                                <Route path="/admin/ia/chaves" element={<OpenAIKeys />} />
                                <Route path="/admin/ia/modelos" element={<OpenAIModels />} />
                                <Route path="/admin/ia/prompt-studio" element={<PromptStudio />} />
                                <Route path="/admin/ia/testes" element={<OpenAIPlayground />} />
                                <Route path="/admin/base-import" element={<ImportBase />} />
                                <Route path="/admin/base-import/test" element={<ValidationTest />} />
                                <Route path="/admin/base" element={<BaseRedirect />} />
                                <Route path="/admin/base/*" element={<BaseLayout />}>
                                  <Route path="processos" element={<ProcessosTable />} />
                                  <Route path="testemunhas" element={<TestemunhasTable />} />
                                </Route>
                                <Route path="/import" element={<Navigate to="/admin/base-import" replace />} />
                                <Route path="/admin/versoes" element={<Versions />} />
                                <Route path="/admin/org" element={<Organization />} />
                                <Route path="/admin/organization" element={<Organization />} />
                                <Route path="/admin/logs" element={<Logs />} />
                                <Route path="/admin/compliance" element={<Compliance />} />
                                <Route path="/admin/marketing" element={<MarketingCompliance />} />
                                <Route path="/admin/retencao" element={<DataRetention />} />
                                <Route path="/admin/audit" element={<AuditPanel />} />
                                <Route path="/admin/config" element={<SystemConfig />} />
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
            </BrowserRouter>
          </ConsentProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
