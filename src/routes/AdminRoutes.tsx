import React, { lazy } from "react";
import { Route } from "react-router-dom";
import { Seo } from "@/components/Seo";

const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Analytics = lazy(() => import("@/pages/admin/Analytics"));
const ImportBase = lazy(() => import("@/pages/admin/ImportBase"));
const Versions = lazy(() => import("@/pages/admin/Versions"));
const Organization = lazy(() => import("@/pages/admin/Organization"));
const SystemConfig = lazy(() => import("@/pages/admin/SystemConfig"));
const Compliance = lazy(() => import("@/pages/admin/Compliance"));
const MarketingCompliance = lazy(() => import("@/pages/admin/MarketingCompliance"));
const DataRetention = lazy(() => import("@/pages/admin/DataRetention"));
const AuditPanel = lazy(() => import("@/pages/admin/AuditPanel"));
const OpenAI = lazy(() => import("@/pages/admin/OpenAI"));
const OpenAIKeys = lazy(() => import("@/pages/admin/openai/Keys"));
const OpenAIModels = lazy(() => import("@/pages/admin/openai/Models"));
const PromptStudio = lazy(() => import("@/pages/admin/openai/PromptStudio"));
const OpenAIPlayground = lazy(() => import("@/pages/admin/openai/Playground"));
const Logs = lazy(() => import("@/pages/admin/Logs"));
const ValidationTest = lazy(() => import("@/pages/admin/ValidationTest"));
const Metrics = lazy(() => import("@/pages/admin/Metrics"));

// Data Explorer components
const BaseRedirect = lazy(() => import("@/pages/admin/base/index"));
const BaseLayout = lazy(() => import("@/pages/admin/base/BaseLayout"));
const ProcessosTable = lazy(() => import("@/pages/admin/base/ProcessosTable"));
const TestemunhasTable = lazy(() => import("@/pages/admin/base/TestemunhasTable"));

const withSeo = (path: string, element: React.ReactNode) => (
  <>
    <Seo path={path} />
    {element}
  </>
);

const AdminRoutes = () => (
  <>
    <Route path="/admin" element={withSeo("/admin", <Dashboard />)} />
    <Route path="/admin/analytics" element={withSeo("/admin/analytics", <Analytics />)} />
    <Route path="/admin/metrics" element={withSeo("/admin/metrics", <Metrics />)} />
    <Route path="/admin/ia" element={withSeo("/admin/ia", <OpenAI />)} />
    <Route path="/admin/ia/chaves" element={withSeo("/admin/ia/chaves", <OpenAIKeys />)} />
    <Route path="/admin/ia/modelos" element={withSeo("/admin/ia/modelos", <OpenAIModels />)} />
    <Route path="/admin/ia/prompt-studio" element={withSeo("/admin/ia/prompt-studio", <PromptStudio />)} />
    <Route path="/admin/ia/testes" element={withSeo("/admin/ia/testes", <OpenAIPlayground />)} />
    <Route path="/admin/base-import" element={withSeo("/admin/base-import", <ImportBase />)} />
    <Route path="/admin/base-import/test" element={withSeo("/admin/base-import/test", <ValidationTest />)} />
    <Route path="/admin/base" element={withSeo("/admin/base", <BaseRedirect />)} />
    <Route path="/admin/base/*" element={withSeo("/admin/base", <BaseLayout />)}>
      <Route path="processos" element={withSeo("/admin/base/processos", <ProcessosTable />)} />
      <Route path="testemunhas" element={withSeo("/admin/base/testemunhas", <TestemunhasTable />)} />
    </Route>
    <Route path="/admin/versoes" element={withSeo("/admin/versoes", <Versions />)} />
    <Route path="/admin/org" element={withSeo("/admin/org", <Organization />)} />
    <Route path="/admin/organization" element={withSeo("/admin/organization", <Organization />)} />
    <Route path="/admin/logs" element={withSeo("/admin/logs", <Logs />)} />
    <Route path="/admin/compliance" element={withSeo("/admin/compliance", <Compliance />)} />
    <Route path="/admin/marketing" element={withSeo("/admin/marketing", <MarketingCompliance />)} />
    <Route path="/admin/retencao" element={withSeo("/admin/retencao", <DataRetention />)} />
    <Route path="/admin/audit" element={withSeo("/admin/audit", <AuditPanel />)} />
    <Route path="/admin/config" element={withSeo("/admin/config", <SystemConfig />)} />
  </>
);

export default AdminRoutes;
