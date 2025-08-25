import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Settings, 
  Mail, 
  UserCheck,
  UserX,
  Shield,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationData {
  id: string;
  name: string;
  code: string;
  domain?: string;
  require_2fa: boolean;
  export_limit: string;
  retention_months: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  is_active: boolean;
  created_at: string;
}

const Organization = () => {
  const { profile } = useAuth();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('VIEWER');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState<OrganizationData | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchOrganizationData();
      fetchUsers();
    }
  }, [profile?.organization_id]);

  const fetchOrganizationData = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile?.organization_id)
        .single();

      if (error) throw error;
      setOrgData(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados da organização",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar usuários",
        variant: "destructive"
      });
    }
  };

  const handleSaveOrganization = async () => {
    if (!orgData || !profile?.organization_id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgData.name,
          domain: orgData.domain,
          require_2fa: orgData.require_2fa,
          export_limit: orgData.export_limit,
          retention_months: orgData.retention_months,
        })
        .eq('id', profile.organization_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados da organização salvos com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !profile?.organization_id) return;
    
    try {
      // Here you would typically call an edge function to send an invite
      // For now, just show a success message
      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${inviteEmail} com perfil ${inviteRole}`,
      });
      
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('VIEWER');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o convite",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Não foi possível carregar dados da organização</p>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-destructive text-destructive-foreground">Admin</Badge>;
      case 'ANALYST':
        return <Badge className="bg-primary text-primary-foreground">Analista</Badge>;
      case 'VIEWER':
        return <Badge variant="secondary">Visualizador</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-success text-success-foreground">Ativo</Badge>;
    } else {
      return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organização & Acessos</h1>
        <p className="text-muted-foreground">
          Gerencie dados da organização, usuários e políticas de acesso
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Dados da Organização
            </CardTitle>
            <CardDescription>
              Informações básicas e configurações da organização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Nome da Organização</Label>
                <Input 
                  id="orgName" 
                  value={orgData.name} 
                  onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgCode">Código</Label>
                <Input id="orgCode" value={orgData.code} disabled />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="domain">Domínio Permitido</Label>
              <Input 
                id="domain" 
                value={orgData.domain || ''} 
                placeholder="exemplo.com"
                onChange={(e) => setOrgData({...orgData, domain: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Retenção de Dados (meses)</Label>
              <Input 
                id="retention" 
                type="number" 
                value={orgData.retention_months}
                onChange={(e) => setOrgData({...orgData, retention_months: parseInt(e.target.value)})}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleSaveOrganization}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Políticas de Segurança</CardTitle>
            <CardDescription>
              Configure políticas de acesso e segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exigir Autenticação 2FA</Label>
                <p className="text-sm text-muted-foreground">
                  Obrigatório para todos os usuários
                </p>
              </div>
              <Switch 
                checked={orgData.require_2fa} 
                onCheckedChange={(checked) => setOrgData({...orgData, require_2fa: checked})}
              />
            </div>

            <div className="space-y-2">
              <Label>Limite de Export</Label>
              <Select 
                value={orgData.export_limit}
                onValueChange={(value) => setOrgData({...orgData, export_limit: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE_BASED">Baseado no Papel</SelectItem>
                  <SelectItem value="UNLIMITED">Ilimitado</SelectItem>
                  <SelectItem value="RESTRICTED">Restrito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 space-y-2">
              <h4 className="font-medium">Limites por Papel:</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>VIEWER:</span>
                  <span>Copiar bloco</span>
                </div>
                <div className="flex justify-between">
                  <span>ANALYST:</span>
                  <span>Export CSV</span>
                </div>
                <div className="flex justify-between">
                  <span>ADMIN:</span>
                  <span>PDF/CSV completo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários & Acessos
            </div>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Convidar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Envie um convite para um novo usuário com papel específico
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="usuario@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Papel Inicial</Label>
                     <Select 
                      value={inviteRole} 
                      onValueChange={(value: 'ADMIN' | 'ANALYST' | 'VIEWER') => setInviteRole(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">Visualizador</SelectItem>
                        <SelectItem value="ANALYST">Analista</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleInviteUser}>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Convite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Gerencie usuários, papéis e status de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.email.split('@')[0]}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.is_active)}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" title="Ativar usuário">
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-warning hover:text-warning-foreground hover:bg-warning-light" title="Alterar papel">
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive-foreground hover:bg-destructive-light" title="Desativar usuário">
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Organization;