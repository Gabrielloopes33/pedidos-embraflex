import { NavLink } from "@/componentes/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Factory,
  FileText,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/componentes/ui/sidebar";
import { Button } from "@/componentes/ui/button";

const menuItems = [
  { title: "Nova Cotação", url: "/cotacoes/nova", icon: FileText },
  { title: "Pedidos", url: "/orders", icon: ShoppingCart },
  { title: "Clientes", url: "/customers", icon: Users },
  // Ocultos: Dashboard, Produtos, Relatórios, Configurações, Produção
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          {open ? (
            <div className="flex flex-col items-center w-full gap-2">
              <img 
                src="/Logo-Embraflex-001.png" 
                alt="Embraflex Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  // Fallback se a logo não existir
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-10 h-10 bg-gradient-primary rounded-lg items-center justify-center flex-shrink-0" style={{ display: 'none' }}>
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <p className="text-xs text-sidebar-foreground/60 text-center">Sistema de Pedidos</p>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => (window.location.href = "/login")}
        >
          <LogOut className="w-5 h-5" />
          {open && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
