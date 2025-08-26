import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ChatApp from "./pages/ChatApp";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
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
import MapaTestemunhas from "./pages/MapaTestemunhas";

// Analytics component import and routes
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/app/chat" 
              element={
                <AuthGuard>
                  <ChatApp />
                </AuthGuard>
              } 
            />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="ia" element={<OpenAI />} />
              <Route path="ia/chaves" element={<OpenAIKeys />} />
              <Route path="ia/modelos" element={<OpenAIModels />} />
              <Route path="ia/prompt-studio" element={<PromptStudio />} />
              <Route path="ia/testes" element={<OpenAIPlayground />} />
              <Route path="base" element={<ImportBase />} />
              <Route path="versoes" element={<Versions />} />
              <Route path="org" element={<Organization />} />
              <Route path="dados" element={<DataExplorer />} />
              <Route path="logs" element={<Logs />} />
              <Route path="config" element={<SystemConfig />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
