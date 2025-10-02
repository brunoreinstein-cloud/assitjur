import { useAuth } from '@/hooks/useAuth';
import { NavItem } from '@/config/sidebar';

export function usePermissions() {
  const { user, hasRole, isAdmin, isSuperAdmin } = useAuth();

  // Permission mapping based on user roles and specific permissions
  const canAccess = (item: NavItem): boolean => {
    // If no permission required, allow access
    if (!item.permission) {
      return true;
    }

    // Super admin has access to everything
    if (isSuperAdmin) {
      return true;
    }

    // Admin has access to everything
    if (isAdmin) {
      return true;
    }

    // Map permissions to role-based access
    const permissions: Record<string, boolean> = {
      // Analytics permissions
      canViewAnalytics: hasRole('ADMIN') || hasRole('ANALYST'),
      
      // Data management permissions
      canManageData: hasRole('ADMIN') || hasRole('ANALYST'),
      canImportData: hasRole('ADMIN') || hasRole('ANALYST'),
      canViewVersions: hasRole('ADMIN') || hasRole('ANALYST'),
      
      // Admin-only permissions
      canManageOrg: hasRole('ADMIN'),
      canManagePermissions: hasRole('ADMIN'),
      canViewLogs: hasRole('ADMIN'),
      canManageSettings: hasRole('ADMIN'),
    };

    return permissions[item.permission] || false;
  };

  const getPermissionTooltip = (item: NavItem): string => {
    if (canAccess(item)) {
      return item.description || item.label;
    }
    
    return "Sem permissão para acessar esta funcionalidade";
  };

  const hasAnyPermissionInGroup = (items: NavItem[]): boolean => {
    return items.some(item => canAccess(item));
  };

  return {
    canAccess,
    getPermissionTooltip,
    hasAnyPermissionInGroup,
    user,
    isAdmin,
    isSuperAdmin,
    userRole: user?.user_metadata?.role || 'VIEWER'
  };
}