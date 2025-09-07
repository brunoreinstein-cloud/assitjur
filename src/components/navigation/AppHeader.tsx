import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  SidebarTrigger, 
  useSidebar 
} from '@/components/ui/sidebar';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NotificationCenter } from '@/components/core/NotificationCenter';
import { 
  ChevronRight,
  MessageSquare,
  Database,
  Settings,
  BarChart3,
  Bot,
  Users,
  FileText,
  Home
} from 'lucide-react';

const routeConfig = {
  '/': { label: 'Início', icon: Home },
  '/chat': { label: 'Chat Assistente', icon: MessageSquare },
  '/dados': { label: 'Dados', icon: Database },
  '/dados/mapa': { label: 'Mapa de Testemunhas', icon: Database },
  '/admin': { label: 'Administração', icon: BarChart3 },
  '/admin/ia': { label: 'Inteligência Artificial', icon: Bot },
  '/admin/ia/chaves': { label: 'Chaves API', icon: Settings },
  '/admin/ia/modelos': { label: 'Modelos', icon: Settings },
  '/admin/ia/prompt-studio': { label: 'Prompt Studio', icon: FileText },
  '/admin/ia/testes': { label: 'Playground', icon: Settings },
  '/admin/base': { label: 'Base de Dados', icon: Database },
  '/admin/org': { label: 'Organização', icon: Users },
  '/admin/config': { label: 'Configurações', icon: Settings },
  '/admin/analytics': { label: 'Analytics', icon: BarChart3 },
  '/admin/logs': { label: 'Logs', icon: FileText },
  '/admin/versoes': { label: 'Versões', icon: FileText }
};

export function AppHeader() {
  const location = useLocation();
  const { open: sidebarOpen } = useSidebar();

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Always start with home if not on home page
    if (location.pathname !== '/') {
      breadcrumbs.push({
        path: '/',
        label: 'Início',
        icon: Home
      });
    }

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const config = routeConfig[currentPath];
      
      if (config) {
        breadcrumbs.push({
          path: currentPath,
          label: config.label,
          icon: config.icon,
          isLast: index === pathSegments.length - 1
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentRoute = routeConfig[location.pathname];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <SidebarTrigger className="-ml-1" />
        
        <div className="flex items-center gap-2 flex-1">
          {/* Current page title for mobile */}
          <div className="flex items-center gap-2 md:hidden">
            {currentRoute?.icon && (
              <currentRoute.icon className="h-4 w-4" />
            )}
            <h1 className="font-semibold text-sm">
              {currentRoute?.label || 'AssistJur.IA'}
            </h1>
          </div>

          {/* Breadcrumbs for desktop */}
          <div className="hidden md:flex">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.path}>
                    <BreadcrumbItem>
                      {breadcrumb.isLast ? (
                        <BreadcrumbPage className="flex items-center gap-2">
                          <breadcrumb.icon className="h-4 w-4" />
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink 
                          href={breadcrumb.path}
                          className="flex items-center gap-2 hover:text-foreground"
                        >
                          <breadcrumb.icon className="h-4 w-4" />
                          {breadcrumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                      </BreadcrumbSeparator>
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <NotificationCenter />
          
          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Sistema Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}