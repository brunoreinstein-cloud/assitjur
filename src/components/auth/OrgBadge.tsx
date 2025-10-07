import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Check, Settings, Loader2 } from "lucide-react";
import { useMultiTenant } from "@/contexts/MultiTenantContext";
import { useNavigate } from "react-router-dom";

interface OrgBadgeProps {
  onManageOrgs?: () => void;
}

export const OrgBadge = ({ onManageOrgs }: OrgBadgeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { currentOrg, organizations, loading, switchOrganization } =
    useMultiTenant();

  const handleOrgSelect = async (orgId: string) => {
    if (orgId === currentOrg?.id) return;

    try {
      await switchOrganization(orgId);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  const handleManageOrgs = () => {
    if (onManageOrgs) {
      onManageOrgs();
    } else {
      navigate("/admin/org");
    }
    setIsOpen(false);
  };

  if (loading || !currentOrg) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (organizations.length <= 1) {
    // Single organization - simple badge
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border">
        <Building2 className="h-4 w-4 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{currentOrg.name}</div>
          <div className="text-xs text-muted-foreground">{currentOrg.code}</div>
        </div>
        <Badge
          variant={currentOrg.role === "ADMIN" ? "default" : "secondary"}
          className="text-xs"
        >
          {currentOrg.role === "ADMIN"
            ? "Admin"
            : currentOrg.role === "ANALYST"
              ? "Analista"
              : "Visualizador"}
        </Badge>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-auto p-3 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {currentOrg.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentOrg.code}
              </div>
            </div>
            <Badge
              variant={currentOrg.role === "ADMIN" ? "default" : "secondary"}
              className="text-xs"
            >
              {currentOrg.role === "ADMIN"
                ? "Admin"
                : currentOrg.role === "ANALYST"
                  ? "Analista"
                  : "Visualizador"}
            </Badge>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          Organizações disponíveis
        </div>

        <DropdownMenuSeparator />

        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgSelect(org.id)}
            className="flex items-center gap-2 p-3 cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{org.name}</span>
                {currentOrg.id === org.id && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">{org.code}</div>
            </div>
            <Badge
              variant={org.role === "ADMIN" ? "default" : "secondary"}
              className="text-xs"
            >
              {org.role === "ADMIN"
                ? "Admin"
                : org.role === "ANALYST"
                  ? "Analista"
                  : "Visualizador"}
            </Badge>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleManageOrgs}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          <span>Gerenciar organizações</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
