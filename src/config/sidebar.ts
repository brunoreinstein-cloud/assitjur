import {
  Home,
  Users,
  BarChart3,
  LineChart,
  Database,
  Upload,
  History,
  Briefcase,
  ClipboardList,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
        to: "/app/dashboard",
        icon: Home,
        description: "Visão geral",
      },
      {
        label: "Mapa de Testemunhas",
        to: "/app/mapa-testemunhas",
        icon: Users,
        description: "Análise de vínculos e padrões com assistente integrado",
      },
    ],
  },
  {
    title: "Análises",
    items: [
      {
        label: "Painel",
        to: "/app/admin",
        icon: BarChart3,
        description: "Dashboard executivo",
        permission: "canViewAnalytics",
      },
      {
        label: "Relatórios",
        to: "/app/admin/analytics",
        icon: LineChart,
        description: "Análises detalhadas",
        permission: "canViewAnalytics",
      },
    ],
  },
  {
    title: "Dados",
    items: [
      {
        label: "Base de Dados",
        to: "/app/admin/base",
        icon: Database,
        description: "Gestão de dados centralizados",
        permission: "canManageData",
      },
      {
        label: "Importação",
        to: "/app/admin/base-import",
        icon: Upload,
        description: "Upload e validação de planilhas",
        permission: "canImportData",
      },
      {
        label: "Versões",
        to: "/app/admin/versoes",
        icon: History,
        description: "Histórico e rollback",
        permission: "canViewVersions",
        badge: "2", // Example badge
      },
    ],
  },
  {
    title: "Administração",
    items: [
      {
        label: "Organização",
        to: "/app/admin/organization",
        icon: Briefcase,
        description: "Configurações organizacionais",
        permission: "canManageOrg",
      },
      {
        label: "Logs",
        to: "/app/admin/logs",
        icon: ClipboardList,
        description: "Auditoria e monitoramento",
        permission: "canViewLogs",
        badge: 3, // Example badge
      },
      {
        label: "Configurações",
        to: "/app/settings",
        icon: Settings,
        description: "Configurações da organização",
        permission: "canManageSettings",
      },
    ],
  },
];

// Flatten all items for search functionality
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap(
  (group) => group.items,
);
