import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import { AppLayout } from "@/components/navigation/AppLayout";
import { ErrorBoundary } from "@/components/core/ErrorBoundary";

import Index from "./pages/Index";
import PublicHome from "./pages/PublicHome";
import Login from "./pages/Login";
import Reset from "./pages/Reset";
import ResetConfirm from "./pages/ResetConfirm";
import VerifyOtp from "./pages/VerifyOtp";
import Chat from "./pages/Chat";
import ChatApp from "./pages/ChatApp";
import NotFound from "./pages/NotFound";

import Dashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";
import ImportBase from "./pages/admin/ImportBase";
import Versions from "./pages/admin/Versions";
import Organization from "./pages/admin/Organization";
import DataExplorer from "./pages/admin/DataExplorer";
import SystemConfig from "./pages/admin/SystemConfig";
import OpenAI from "./pages/admin/OpenAI";
import OpenAIKeys from "./pages/admin/openai/Keys";
import OpenAIModels from "./pages/admin/openai/Models";
import PromptStudio from "./pages/admin/openai/PromptStudio";
import OpenAIPlayground from "./pages/admin/openai/Playground";
import Logs from "./pages/admin/Logs";


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
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicHome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset" element={<Reset />} />
              <Route path="/reset/confirm" element={<ResetConfirm />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              
              {/* Protected routes with app layout */}
              <Route path="/*" element={
                <AuthGuard>
                  <AppLayout>
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/dashboard" element={<Index />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/dados/mapa" element={<Index />} />
                        <Route path="/app/chat" element={<ChatApp />} />
                        
                        {/* Admin routes */}
                        <Route path="/admin" element={<Dashboard />} />
                        <Route path="/admin/analytics" element={<Analytics />} />
                        <Route path="/admin/ia" element={<OpenAI />} />
                        <Route path="/admin/ia/chaves" element={<OpenAIKeys />} />
                        <Route path="/admin/ia/modelos" element={<OpenAIModels />} />
                        <Route path="/admin/ia/prompt-studio" element={<PromptStudio />} />
                        <Route path="/admin/ia/testes" element={<OpenAIPlayground />} />
                        <Route path="/admin/base" element={<ImportBase />} />
                        <Route path="/admin/versoes" element={<Versions />} />
                        <Route path="/admin/org" element={<Organization />} />
                        <Route path="/admin/dados" element={<DataExplorer />} />
                        <Route path="/admin/logs" element={<Logs />} />
                        <Route path="/admin/config" element={<SystemConfig />} />
                        
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
