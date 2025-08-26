import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Check, Settings } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  code: string;
  role: 'ADMIN' | 'USER';
}

interface OrgBadgeProps {
  currentOrg?: Organization;
  organizations?: Organization[];
  onOrgChange?: (org: Organization) => void;
  onManageOrgs?: () => void;
}

export const OrgBadge = ({ 
  currentOrg, 
  organizations = [], 
  onOrgChange,
  onManageOrgs 
}: OrgBadgeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mock data for demonstration
  const mockOrgs: Organization[] = [
    {
      id: 'org-1',
      name: 'Silva & Associados',
      code: 'SILVA_ADV',
      role: 'ADMIN'
    },
    {
      id: 'org-2', 
      name: 'Escritório Santos',
      code: 'SANTOS_LAW',
      role: 'USER'
    }
  ];

  const orgs = organizations.length > 0 ? organizations : mockOrgs;
  const current = currentOrg || orgs[0];

  const handleOrgSelect = (org: Organization) => {
    onOrgChange?.(org);
    setIsOpen(false);
  };

  if (orgs.length <= 1) {
    // Single organization - simple badge
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border">
        <Building2 className="h-4 w-4 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{current.name}</div>
          <div className="text-xs text-muted-foreground">{current.code}</div>
        </div>
        <Badge variant={current.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
          {current.role === 'ADMIN' ? 'Admin' : 'Usuário'}
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
              <div className="text-sm font-medium truncate">{current.name}</div>
              <div className="text-xs text-muted-foreground">{current.code}</div>
            </div>
            <Badge variant={current.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
              {current.role === 'ADMIN' ? 'Admin' : 'Usuário'}
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
        
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgSelect(org)}
            className="flex items-center gap-2 p-3 cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{org.name}</span>
                {current.id === org.id && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">{org.code}</div>
            </div>
            <Badge 
              variant={org.role === 'ADMIN' ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {org.role === 'ADMIN' ? 'Admin' : 'Usuário'}
            </Badge>
          </DropdownMenuItem>
        ))}
        
        {onManageOrgs && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onManageOrgs} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Gerenciar organizações</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};