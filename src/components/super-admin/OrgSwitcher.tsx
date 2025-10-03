import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface OrgSwitcherProps {
  onOrgChange?: (orgId: string | null) => void;
  selectedOrgId?: string | null;
}

export function OrgSwitcher({ onOrgChange, selectedOrgId }: OrgSwitcherProps) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, code, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setOrgs(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar organizações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = (orgId: string | null) => {
    onOrgChange?.(orgId);
  };

  const selectedOrg = orgs.find((org) => org.id === selectedOrgId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[250px] justify-between"
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="truncate">
              {loading
                ? "Carregando..."
                : selectedOrg?.name || "Todas as organizações"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]">
        <DropdownMenuLabel>Filtrar por organização</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleSelectOrg(null)}
          className="cursor-pointer"
        >
          <Check
            className={cn(
              "mr-2 h-4 w-4",
              !selectedOrgId ? "opacity-100" : "opacity-0",
            )}
          />
          Todas as organizações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelectOrg(org.id)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                selectedOrgId === org.id ? "opacity-100" : "opacity-0",
              )}
            />
            <div className="flex flex-col">
              <span>{org.name}</span>
              <span className="text-xs text-muted-foreground">{org.code}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
