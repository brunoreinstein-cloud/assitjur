import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { OrgSwitcher } from './OrgSwitcher';
import { 
  Building2, 
  Users, 
  FileText, 
  UserCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrgSummary {
  org_id: string;
  org_name: string;
  org_code: string;
  is_active: boolean;
  total_members: number;
  total_processos: number;
  total_pessoas: number;
  created_at: string;
  last_activity: string;
}

export function OrgList() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_orgs_summary');
      
      if (error) throw error;
      setOrgs(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar organizações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = selectedOrgId
    ? orgs.filter(org => org.org_id === selectedOrgId)
    : orgs;

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Organizações</h2>
          <Badge variant="secondary">{filteredOrgs.length}</Badge>
        </div>
        <OrgSwitcher 
          onOrgChange={setSelectedOrgId} 
          selectedOrgId={selectedOrgId}
        />
      </div>

      {filteredOrgs.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          Nenhuma organização encontrada.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrgs.map((org) => (
            <Card key={org.org_id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{org.org_name}</h3>
                      <Badge variant="outline">{org.org_code}</Badge>
                      {org.is_active ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Criada {formatDistanceToNow(new Date(org.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        <span>
                          Última atividade {formatDistanceToNow(new Date(org.last_activity), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Membros</p>
                      <p className="text-lg font-semibold">{org.total_members}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <FileText className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Processos</p>
                      <p className="text-lg font-semibold">{org.total_processos}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <UserCircle className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pessoas</p>
                      <p className="text-lg font-semibold">{org.total_pessoas}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
