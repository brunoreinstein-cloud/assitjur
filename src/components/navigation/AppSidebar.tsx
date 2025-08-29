import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NAV_GROUPS } from '@/config/sidebar';
import { ThemeToggle } from './ThemeToggle';
import { CommandPalette } from './CommandPalette';
import { 
  User,
  LogOut,
  UserCog
} from 'lucide-react';

export function AppSidebar() {
  const { open, setOpen, openMobile, setOpenMobile, isMobile, state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { canAccess, getPermissionTooltip, hasAnyPermissionInGroup, userRole } = usePermissions();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado da aplicação.",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive' as const;
      case 'ANALYST':
        return 'default' as const;
      case 'VIEWER':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'ANALYST':
        return 'Analyst';
      case 'VIEWER':
        return 'Viewer';
      default:
        return 'Usuário';
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
      <Sidebar 
        variant="sidebar" 
        className={`bg-sidebar border-sidebar-border transition-all duration-300 ${
          !open ? 'w-[72px]' : 'w-60'
        }`}
      >
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/7a3da188-83da-4e1d-b4e2-30254d487fae.png" 
              alt="AssistJur.IA" 
              className="h-8 w-8 object-contain flex-shrink-0"
            />
            {open && (
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-sidebar-foreground truncate">AssistJur.IA</h2>
                <p className="text-xs text-sidebar-foreground/60">Legal Intelligence</p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2 space-y-2">
          {NAV_GROUPS.map((group) => {
            // Only show group if user has permission to access at least one item
            const accessibleItems = group.items.filter(canAccess);
            if (accessibleItems.length === 0) return null;

            return (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/80 px-3 pt-4 pb-1">
                  {open && group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const canAccessItem = canAccess(item);
                      const active = isActive(item.to);
                      
                      if (!canAccessItem) {
                        // Show disabled item with tooltip for admin visibility
                        return (
                          <SidebarMenuItem key={item.to}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed rounded-md">
                                  <item.icon className="h-4 w-4" />
                                  {open && <span>{item.label}</span>}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>{getPermissionTooltip(item)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </SidebarMenuItem>
                        );
                      }

                      const MenuButton = (
                        <NavLink 
                          to={item.to}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors group ${
                            active 
                              ? 'bg-primary/10 text-foreground border-l-2 border-primary' 
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                          aria-current={active ? 'page' : undefined}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {open && (
                            <div className="flex items-center justify-between w-full min-w-0">
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <Badge 
                                  variant="secondary" 
                                  className="ml-2 text-xs h-5 px-1.5 bg-primary/20 text-primary border-0"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          )}
                        </NavLink>
                      );

                      return (
                        <SidebarMenuItem key={item.to}>
                          {!open ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {MenuButton}
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>{getPermissionTooltip(item)}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            MenuButton
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-4 space-y-3">
          {/* Theme Toggle and Command Palette */}
          <div className="flex items-center justify-center gap-2">
            <ThemeToggle />
            <CommandPalette />
          </div>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent text-left w-full transition-colors">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {open && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={getRoleBadgeVariant(userRole)} 
                      className="text-xs"
                    >
                      {getRoleLabel(userRole)}
                    </Badge>
                  </div>
                </div>
              )}
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <UserCog className="h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}