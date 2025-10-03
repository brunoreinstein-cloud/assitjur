import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { AppHeader } from "@/components/navigation/AppHeader";
import { PageFade } from "@/components/core/PageFade";
import { PageTransition } from "@/components/core/PageTransition";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />

          <main className="flex-1 overflow-hidden">
            <PageTransition>
              <PageFade>{children}</PageFade>
            </PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
