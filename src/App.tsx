import { Suspense, lazy } from "react";
import { MotionConfig } from "framer-motion";
import { DEFAULT_TRANSITION } from "@/config/motion";
// Removed heavy UI providers from App root (agora dentro de PrivateProviders)
import ConsentDialog from "@/components/privacy/ConsentDialog";
import { PageSkeleton } from "@/components/core/PageSkeleton";
// Removed QueryClient import – gerenciado dentro de PrivateProviders
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
// Providers e boundaries agora estão encapsulados em PrivateProviders
import { RouteGuard } from "@/components/routing/RouteGuard";
import { DemoRoutes } from "@/routes/DemoRoutes";
import { ErrorBoundary } from "@/components/core/ErrorBoundary";
import { ErrorBoundary as SystemErrorBoundary } from "@/components/system/ErrorBoundary";
import { LoginErrorBoundary } from "@/components/auth/LoginErrorBoundary";
import { ProductionOptimizer } from "@/components/production/ProductionOptimizer";

// ... keep existing code

// Admin pages (lazy loaded)
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Analytics = lazy(() => import("@/pages/admin/Analytics"));
const SuperAdminDashboard = lazy(() => import("@/pages/super-admin/Dashboard"));
const UserManagement = lazy(() => import("@/pages/super-admin/UserManagement"));
const ImportBase = lazy(() => import("@/pages/admin/ImportBase"));
const Versions = lazy(() => import("@/pages/admin/Versions"));
const Organization = lazy(() => import("@/pages/admin/Organization"));
const SystemConfig = lazy(() => import("@/pages/admin/SystemConfig"));
const Compliance = lazy(() => import("@/pages/admin/Compliance"));
const MarketingCompliance = lazy(
  () => import("@/pages/admin/MarketingCompliance"),
);
const DataRetention = lazy(() => import("@/pages/admin/DataRetention"));
const AppHome = lazy(() => import("@/pages/AppHome"));
const OpenAI = lazy(() => import("@/pages/admin/OpenAI"));
const OpenAIKeys = lazy(() => import("@/pages/admin/openai/Keys"));
const OpenAIModels = lazy(() => import("@/pages/admin/openai/Models"));
const PromptStudio = lazy(() => import("@/pages/admin/openai/PromptStudio"));
const OpenAIPlayground = lazy(() => import("@/pages/admin/openai/Playground"));
const ValidationTest = lazy(() => import("@/pages/admin/ValidationTest"));
const Metrics = lazy(() => import("@/pages/admin/Metrics"));
const FeatureFlagMetrics = lazy(
  () => import("@/pages/admin/FeatureFlagMetrics"),
);
const BaseRedirect = lazy(() => import("@/pages/admin/base/index"));
const BaseLayout = lazy(() => import("@/pages/admin/base/BaseLayout"));
const ProcessosTable = lazy(() => import("@/pages/admin/base/ProcessosTable"));
const TestemunhasTable = lazy(
  () => import("@/pages/admin/base/TestemunhasTable"),
);

// Profile and Settings pages
const Profile = lazy(() => import("@/pages/Profile"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
import FeatureFlagGuard from "@/components/FeatureFlagGuard";
import { useMaintenance } from "@/hooks/useMaintenance";
import { PrivateProviders } from "@/app/providers/PrivateProviders";

// Páginas com lazy loading ULTRA-OTIMIZADO para prevenir Out of Memory
const MapaPage = lazy(() => import("@/pages/MapaPage"));
const PublicHome = lazy(() => import("@/pages/PublicHome"));
const About = lazy(() => import("@/pages/About"));
const Beta = lazy(() => import("@/pages/Beta"));
const Login = lazy(() => import("@/pages/Login"));
const Reset = lazy(() => import("@/pages/Reset"));
const ResetConfirm = lazy(() => import("@/pages/ResetConfirm"));
const ResetPasswordPage = lazy(() => import("@/routes/reset-password"));
const VerifyOtp = lazy(() => import("@/pages/VerifyOtp"));
const PortalTitular = lazy(() => import("@/pages/PortalTitular"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TemplatePage = lazy(() => import("@/pages/TemplatePage"));
const ReportDemo = lazy(() => import("@/pages/ReportDemo"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("@/pages/TermsOfUse"));
const LGPD = lazy(() => import("@/pages/LGPD"));
const TwoFactorSetup = lazy(() => import("@/pages/TwoFactorSetup"));
const ServerError = lazy(() => import("@/pages/ServerError"));
const Status = lazy(() => import("@/pages/Status"));

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
      {/* ===== PUBLIC ROUTES (No Authentication) ===== */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/sobre" element={<About />} />
      <Route path="/beta" element={<Beta />} />
      <Route path="/login" element={
        <LoginErrorBoundary>
          <Login />
        </LoginErrorBoundary>
      } />
      <Route path="/reset" element={<Reset />} />
      <Route path="/reset/confirm" element={<ResetConfirm />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/portal-titular" element={<PortalTitular />} />
      <Route path="/import/template" element={<TemplatePage />} />
      <Route path="/privacidade" element={<PrivacyPolicy />} />
      <Route path="/termos" element={<TermsOfUse />} />
      <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
      <Route path="/termos-de-uso" element={<TermsOfUse />} />
      <Route path="/lgpd" element={<LGPD />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="/status" element={<Status />} />
      
      {/* Demo Routes - Public */}
      <Route path="/demo/*" element={<DemoRoutes />} />

      {/* ===== PROTECTED ROUTES (Under /app/*) ===== */}
      <Route
        path="/app/*"
        element={
          <RouteGuard>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </RouteGuard>
        }
      >
        {/* Main Dashboard */}
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<AppHome />} />
        
        {/* Mapa de Testemunhas */}
        <Route path="mapa-testemunhas" element={<MapaPage />} />
        <Route path="mapa" element={<Navigate to="/app/mapa-testemunhas" replace />} />
        <Route path="dados" element={<Navigate to="/app/mapa-testemunhas" replace />} />
        <Route path="dados/mapa" element={<Navigate to="/app/mapa-testemunhas" replace />} />
        
        {/* Chat redirect */}
        <Route path="chat" element={<Navigate to="/app/mapa-testemunhas?view=chat" replace />} />

        {/* Super Admin Routes */}
        <Route path="super-admin" element={<SuperAdminDashboard />} />
        <Route path="super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="super-admin/users" element={<UserManagement />} />

        {/* Admin Routes */}
        <Route path="admin" element={<Dashboard />} />
        <Route path="admin/dashboard" element={<Dashboard />} />
        <Route path="admin/analytics" element={<Analytics />} />
        <Route path="admin/metrics" element={<Metrics />} />
        <Route path="admin/feature-flags/metrics" element={<FeatureFlagMetrics />} />
        
        {/* IA Routes */}
        <Route path="admin/ia" element={<OpenAI />} />
        <Route path="admin/ia/chaves" element={<OpenAIKeys />} />
        <Route path="admin/ia/modelos" element={<OpenAIModels />} />
        <Route path="admin/ia/prompt-studio" element={<PromptStudio />} />
        <Route path="admin/ia/testes" element={<OpenAIPlayground />} />
        
        {/* Base Import Routes */}
        <Route path="admin/base-import" element={<ImportBase />} />
        <Route path="admin/base-import/test" element={<ValidationTest />} />
        <Route path="import" element={<Navigate to="/app/admin/base-import" replace />} />
        
        {/* Base Data Routes */}
        <Route path="admin/base" element={<BaseRedirect />} />
        <Route path="admin/base/*" element={<BaseLayout />}>
          <Route path="processos" element={<ProcessosTable />} />
          <Route path="testemunhas" element={<TestemunhasTable />} />
        </Route>
        
        {/* Admin Management */}
        <Route path="admin/versoes" element={<Versions />} />
        <Route path="admin/org" element={<Organization />} />
        <Route path="admin/organization" element={<Organization />} />
        <Route path="admin/compliance" element={<Compliance />} />
        <Route path="admin/marketing" element={<MarketingCompliance />} />
        <Route path="admin/retencao" element={<DataRetention />} />
        <Route path="admin/config" element={<SystemConfig />} />
        
        {/* Reports */}
        <Route
          path="relatorio"
          element={
            <FeatureFlagGuard flag="advanced-report">
              <ReportDemo />
            </FeatureFlagGuard>
          }
        />
        
        {/* Account & Settings */}
        <Route path="account/2fa" element={<TwoFactorSetup />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* ===== LEGACY REDIRECTS (Backward Compatibility) ===== */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/mapa-testemunhas" element={<Navigate to="/app/mapa-testemunhas" replace />} />
      <Route path="/mapa" element={<Navigate to="/app/mapa-testemunhas" replace />} />
      <Route path="/admin/*" element={<Navigate to="/app/admin" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      <Route path="/chat" element={<Navigate to="/app/mapa-testemunhas?view=chat" replace />} />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// React Query client configuration
// Mantemos a instância caso outras partes usem, mas não é utilizada neste arquivo
// queryClient não é mais usado diretamente neste arquivo

// ✅ Router selection based on environment
const Router = import.meta.env.VITE_USE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter;

// Component that handles all routes with proper providers
const AppContent = () => {
  return (
    <PrivateProviders>
      <ConsentDialog />
      <Suspense fallback={<PageSkeleton />}>
        <AppRoutes />
      </Suspense>
    </PrivateProviders>
  );
};

const App = () => {
  return (
    <SystemErrorBoundary>
      <ErrorBoundary>
        <ProductionOptimizer />
        <MotionConfig reducedMotion="user" transition={DEFAULT_TRANSITION}>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppContent />
          </Router>
        </MotionConfig>
      </ErrorBoundary>
    </SystemErrorBoundary>
  );
};

export default App;
