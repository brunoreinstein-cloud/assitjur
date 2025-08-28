import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Database, 
  Settings, 
  BarChart3, 
  FileText, 
  Users, 
  Shield,
  Bot,
  Home,
  LogOut,
  User,
  ChevronRight,
  Upload,
  History
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
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const mainNavItems = [
  {
    title: 'Início',
    url: '/',
    icon: Home,
    description: 'Mapa de Testemunhas'
  },
  {
    title: 'Chat Assistente',
    url: '/chat',
    icon: MessageSquare,
    description: 'Análise com IA'
  }
];

const adminNavItems = [
  {
    title: 'Dashboard Admin',
    url: '/admin',
    icon: BarChart3,
    description: 'Painel administrativo'
  },
  {
    title: 'Analytics Avançado',
    url: '/admin/analytics',
    icon: BarChart3,
    description: 'Relatórios detalhados'
  },
  {
    title: 'Inteligência Artificial',
    url: '/admin/ia',
    icon: Bot,
    description: 'Configurações de IA'
  },
  {
    title: 'Base de Dados',
    url: '/admin/base',
    icon: Database,
    description: 'Visualizar e explorar dados'
  },
  {
    title: 'Importação de Dados',
    url: '/admin/base-import',
    icon: Upload,
    description: 'Upload e importação'
  },
  {
    title: 'Versões',
    url: '/admin/versoes',
    icon: History,
    description: 'Histórico e rollback'
  },
  {
    title: 'Organização',
    url: '/admin/org',
    icon: Users,
    description: 'Usuários e acessos'
  },
  {
    title: 'Logs',
    url: '/admin/logs',
    icon: FileText,
    description: 'Auditoria do sistema'
  },
  {
    title: 'Configurações',
    url: '/admin/config',
    icon: Settings,
    description: 'Parâmetros do sistema'
  }
];

export function AppSidebar() {
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const { user, profile, signOut, hasRole } = useAuth();
  const { toast } = useToast();
  
  const currentPath = location.pathname;
  const isAdmin = hasRole('ADMIN');

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary' 
      : 'hover:bg-accent hover:text-accent-foreground';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: "Tente novamente."
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'ANALYST': return 'secondary';
      case 'VIEWER': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'ANALYST': return 'Analista';  
      case 'VIEWER': return 'Visualizador';
      default: return role;
    }
  };

  return (
    <Sidebar className={`${!sidebarOpen ? 'w-16' : 'w-64'} border-r`} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg text-primary-foreground font-bold">
            H
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-lg">Hubjuria</span>
              <span className="text-xs text-muted-foreground">Assistente Legal</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={!sidebarOpen ? 'sr-only' : ''}>
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${getNavClassName(item.url)}`}
                      title={!sidebarOpen ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {sidebarOpen && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      )}
                      {sidebarOpen && isActive(item.url) && (
                        <ChevronRight className="h-3 w-3 ml-auto" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={!sidebarOpen ? 'sr-only' : ''}>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Administração
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="w-full">
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${getNavClassName(item.url)}`}
                        title={!sidebarOpen ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {sidebarOpen && (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{item.title}</span>
                            <span className="text-xs text-muted-foreground">{item.description}</span>
                          </div>
                        )}
                        {sidebarOpen && isActive(item.url) && (
                          <ChevronRight className="h-3 w-3 ml-auto" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`w-full justify-start gap-3 p-2 h-auto ${!sidebarOpen ? 'px-2' : ''}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {profile.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {profile.email}
                    </span>
                    <Badge 
                      variant={getRoleBadgeVariant(profile.role)} 
                      className="text-xs"
                    >
                      {getRoleLabel(profile.role)}
                    </Badge>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="top" 
              align="end" 
              className="w-56 bg-background border shadow-lg z-50"
            >
              <DropdownMenuItem className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}