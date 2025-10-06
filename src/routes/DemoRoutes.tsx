import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load demo pages
const DemoMapaTestemunhas = lazy(() => import("@/pages/DemoMapaTestemunhas"));

const DemoLoadingSkeleton = () => (
  <div className="min-h-screen bg-background p-8">
    <div className="max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  </div>
);

/**
 * DemoRoutes - Public demonstration routes
 * 
 * Features:
 * - No authentication required
 * - SEO optimized for each demo
 * - Isolated from /app/* protected routes
 */
export function DemoRoutes() {
  return (
    <Suspense fallback={<DemoLoadingSkeleton />}>
      <Routes>
        <Route path="mapa-testemunhas" element={<DemoMapaTestemunhas />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
