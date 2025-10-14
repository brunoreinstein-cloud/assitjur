import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider as SupabaseAuthProvider } from "@/providers/AuthProvider";
import { AuthProvider as AuthContextProvider } from "@/hooks/useAuth";
import { FeatureFlagProvider } from "@/hooks/useFeatureFlag";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ServiceHealthProvider } from "@/hooks/useServiceHealth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 3, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

export function PrivateProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ServiceHealthProvider>
        <AuthContextProvider>
          <SupabaseAuthProvider>
            <FeatureFlagProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {children}
              </TooltipProvider>
            </FeatureFlagProvider>
          </SupabaseAuthProvider>
        </AuthContextProvider>
      </ServiceHealthProvider>
    </QueryClientProvider>
  );
}


