import { 
  Home, 
  Users, 
  MessageSquare, 
  BarChart3, 
  LineChart, 
  Database, 
  Upload, 
  History, 
  Briefcase, 
  ShieldCheck, 
  ClipboardList, 
  Settings,
  LucideIcon
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string | number;
  permission?: string;
  description?: string;
};

export type NavGroup = { 
  title: string; 
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  { 
    title: "Operação", 
    items: [
      { 
        label: "Início", 
        to: "/", 
        icon: Home,
        description: "Visão geral"
      },
      { 
        label: "Mapa de Testemunhas", 
        to: "/mapa-testemunhas", 
        icon: Users,
        description: "Análise de vínculos e padrões com assistente integrado"
      },
    ]
  },
  { 
    title: "Análises", 
    items: [
      { 
        label: "Painel", 
        to: "/admin", 
        icon: BarChart3,
        description: "Dashboard executivo",
        permission: "canViewAnalytics"
      },
      { 
        label: "Relatórios", 
        to: "/admin/analytics", 
        icon: LineChart,
        description: "Análises detalhadas",
        permission: "canViewAnalytics"
      },
      {
        label: "Métricas",
        to: "/admin/metrics",
        icon: BarChart3,
        description: "Eventos e TTFV",
        permission: "canViewAnalytics"
      },
    ]
  },
  { 
    title: "Dados", 
    items: [
      { 
        label: "Base de Dados", 
        to: "/admin/base", 
        icon: Database,
        description: "Gestão de dados centralizados",
        permission: "canManageData"
      },
      { 
        label: "Importação", 
        to: "/admin/base-import", 
        icon: Upload,
        description: "Upload e validação de planilhas",
        permission: "canImportData"
      },
      { 
        label: "Versões", 
        to: "/admin/versoes", 
        icon: History,
        description: "Histórico e rollback",
        permission: "canViewVersions",
        badge: "2" // Example badge
      },
    ]
  },
  { 
    title: "Administração", 
    items: [
      { 
        label: "Organização", 
        to: "/admin/organization", 
        icon: Briefcase,
        description: "Configurações organizacionais",
        permission: "canManageOrg"
      },
      { 
        label: "Logs", 
        to: "/admin/logs", 
        icon: ClipboardList,
        description: "Auditoria e monitoramento",
        permission: "canViewLogs",
        badge: 3 // Example badge
      },
      { 
        label: "Configurações", 
        to: "/admin/config", 
        icon: Settings,
        description: "Configurações do sistema",
        permission: "canManageSettings"
      },
    ]
  },
];

// Flatten all items for search functionality
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap(group => group.items);