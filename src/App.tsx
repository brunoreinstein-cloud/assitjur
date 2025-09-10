import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConsentBanner from "@/components/ConsentBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import { AppLayout } from "@/components/navigation/AppLayout";
import { ErrorBoundary } from "@/components/core/ErrorBoundary";

import MapaPage from "./pages/MapaPage";
import PublicHome from "./pages/PublicHome";
import About from "./pages/About";
import Beta from "./pages/Beta";
import Login from "./pages/Login";
import Reset from "./pages/Reset";
import ResetConfirm from "./pages/ResetConfirm";
import VerifyOtp from "./pages/VerifyOtp";
import PortalTitular from "./pages/PortalTitular";
import NotFound from "./pages/NotFound";
import DemoMapaTestemunhas from "./pages/DemoMapaTestemunhas";

import Dashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";
import ImportBase from "./pages/admin/ImportBase";
import TemplatePage from "./pages/TemplatePage";
import Versions from "./pages/admin/Versions";
import Organization from "./pages/admin/Organization";

import SystemConfig from "./pages/admin/SystemConfig";
import Compliance from "./pages/admin/Compliance";
import MarketingCompliance from "./pages/admin/MarketingCompliance";
import DataRetention from "./pages/admin/DataRetention";
import AuditPanel from "./pages/admin/AuditPanel";
import OpenAI from "./pages/admin/OpenAI";
import OpenAIKeys from "./pages/admin/openai/Keys";
import OpenAIModels from "./pages/admin/openai/Models";
import PromptStudio from "./pages/admin/openai/PromptStudio";
import OpenAIPlayground from "./pages/admin/openai/Playground";
import Logs from "./pages/admin/Logs";
import { ReportDemo } from "./pages/ReportDemo";
import ValidationTest from "./pages/admin/ValidationTest";

// Data Explorer components
import BaseRedirect from "./pages/admin/base/index";
import BaseLayout from "./pages/admin/base/BaseLayout";
import ProcessosTable from "./pages/admin/base/ProcessosTable";
import TestemunhasTable from "./pages/admin/base/TestemunhasTable";


// Analytics component import and routes
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
          <ConsentBanner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
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
              <Route path="/*" element={
                <AuthGuard>
                  <AppLayout>
                    <ErrorBoundary>
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
                    </ErrorBoundary>
                  </AppLayout>
                </AuthGuard>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
