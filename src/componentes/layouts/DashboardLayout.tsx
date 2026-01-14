import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/componentes/ui/sidebar";
import { AppSidebar } from "../AppSidebar";
import { BottomNav } from "../BottomNav";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  console.log('📱 DashboardLayout: Renderizando layout...');
  console.log('👶 Children:', children);
  
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar apenas para desktop */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        
        <main className="flex-1 overflow-auto">
          {/* Header com botão do menu (apenas desktop) */}
          <div className="hidden md:block sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-4 py-3">
              <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </SidebarTrigger>
            </div>
          </div>

          {/* Conteúdo principal com padding para bottom nav mobile */}
          <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </div>
        </main>
        
        {/* Bottom Navigation - apenas mobile */}
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
