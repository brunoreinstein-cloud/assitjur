import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  Database, 
  Users, 
  Settings, 
  FileText, 
  CheckCircle, 
  LogOut 
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const adminMenuItems = [
  {
    title: 'Dashboard Admin',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Integração OpenAI',
    url: '/admin/ia',
    icon: Settings,
  },
  {
    title: 'Importar & Publicar Base',
    url: '/admin/base',
    icon: Upload,
  },
  {
    title: 'Versões & Rollback',
    url: '/admin/versoes',
    icon: History,
  },
  {
    title: 'Explorar Dados',
    url: '/admin/dados',
    icon: Database,
  },
  {
    title: 'Organização & Acessos',
    url: '/admin/org',
    icon: Users,
  },
  {
    title: 'Parâmetros & Regras',
    url: '/admin/config',
    icon: Settings,
  },
  {
    title: 'Logs & Auditoria',
    url: '/admin/logs',
    icon: FileText,
  },
  {
    title: 'Qualidade da Base',
    url: '/admin/qualidade',
    icon: CheckCircle,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && "Administração"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin'}
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
      
      <SidebarTrigger className="absolute -right-4 top-4 z-10" />
    </Sidebar>
  );
}