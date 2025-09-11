import React, { lazy } from "react";
import { Route } from "react-router-dom";

const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Analytics = lazy(() => import("@/pages/admin/Analytics"));
const ImportBase = lazy(() => import("@/pages/admin/ImportBase"));
const Versions = lazy(() => import("@/pages/admin/Versions"));
const Organization = lazy(() => import("@/pages/admin/Organization"));
const SystemConfig = lazy(() => import("@/pages/admin/SystemConfig"));
const Compliance = lazy(() => import("@/pages/admin/Compliance"));
const MarketingCompliance = lazy(() => import("@/pages/admin/MarketingCompliance"));
const DataRetention = lazy(() => import("@/pages/admin/DataRetention"));
// const AuditPanel = lazy(() => import("@/pages/admin/AuditPanel")); // Removed due to table dependencies
const OpenAI = lazy(() => import("@/pages/admin/OpenAI"));
const OpenAIKeys = lazy(() => import("@/pages/admin/openai/Keys"));
const OpenAIModels = lazy(() => import("@/pages/admin/openai/Models"));
const PromptStudio = lazy(() => import("@/pages/admin/openai/PromptStudio"));
const OpenAIPlayground = lazy(() => import("@/pages/admin/openai/Playground"));
// const Logs = lazy(() => import("@/pages/admin/Logs")); // Removed due to table dependencies
const ValidationTest = lazy(() => import("@/pages/admin/ValidationTest"));
const Metrics = lazy(() => import("@/pages/admin/Metrics"));
const FeatureFlagMetrics = lazy(() => import("@/pages/admin/FeatureFlagMetrics"));

// Data Explorer components
const BaseRedirect = lazy(() => import("@/pages/admin/base/index"));
const BaseLayout = lazy(() => import("@/pages/admin/base/BaseLayout"));
const ProcessosTable = lazy(() => import("@/pages/admin/base/ProcessosTable"));
const TestemunhasTable = lazy(() => import("@/pages/admin/base/TestemunhasTable"));

const AdminRoutes = () => (
  <>
    <Route path="/admin" element={<Dashboard />} />
    <Route path="/admin/analytics" element={<Analytics />} />
    <Route path="/admin/metrics" element={<Metrics />} />
    <Route path="/admin/feature-flags/metrics" element={<FeatureFlagMetrics />} />
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
    <Route path="/admin/versoes" element={<Versions />} />
    <Route path="/admin/org" element={<Organization />} />
    <Route path="/admin/organization" element={<Organization />} />
    {/* <Route path="/admin/logs" element={<Logs />} /> */}
    <Route path="/admin/compliance" element={<Compliance />} />
    <Route path="/admin/marketing" element={<MarketingCompliance />} />
    <Route path="/admin/retencao" element={<DataRetention />} />
    {/* <Route path="/admin/audit" element={<AuditPanel />} /> */}
    <Route path="/admin/config" element={<SystemConfig />} />
  </>
);

export default AdminRoutes;

