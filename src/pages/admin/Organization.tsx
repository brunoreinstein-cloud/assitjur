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
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import RoleChangeModal from '@/components/admin/RoleChangeModal';
import ConfirmActionModal from '@/components/admin/ConfirmActionModal';

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
  data_access_level: 'FULL' | 'MASKED' | 'NONE';
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

const Organization = () => {
  const { profile } = useAuth();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('VIEWER');
  const [inviteDataAccess, setInviteDataAccess] = useState<'FULL' | 'MASKED' | 'NONE'>('NONE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [orgData, setOrgData] = useState<OrganizationData | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'ANALYST' | 'VIEWER'>('all');
  
  // Modal states
  const [roleChangeUser, setRoleChangeUser] = useState<UserProfile | null>(null);
  const [isRoleChangeModalOpen, setIsRoleChangeModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    user: UserProfile;
    action: 'activate' | 'deactivate' | 'delete';
    title: string;
    description: string;
  } | null>(null);

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
      setFilteredUsers(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar usuários",
        variant: "destructive"
      });
    }
  };

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

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
    
    setActionLoading(true);
    try {
      // Validate domain if set
      if (orgData?.domain) {
        const emailDomain = inviteEmail.split('@')[1];
        if (emailDomain !== orgData.domain) {
          toast({
            title: "Erro",
            description: `E-mail deve ser do domínio ${orgData.domain}`,
            variant: "destructive"
          });
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('user-invitations', {
        body: {
          email: inviteEmail,
          role: inviteRole,
          data_access_level: inviteDataAccess,
          org_id: profile.organization_id
        }
      });

      if (error) throw error;

      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${inviteEmail} com perfil ${inviteRole}`,
      });
      
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('VIEWER');
      setInviteDataAccess('NONE');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o convite",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserAction = async (action: 'activate' | 'deactivate' | 'delete', userId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: {
          action,
          user_id: userId
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: data.message,
      });

      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível executar a ação",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleRoleChange = async (userId: string, role: 'ADMIN' | 'ANALYST' | 'VIEWER', dataAccessLevel: 'FULL' | 'MASKED' | 'NONE') => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: {
          action: 'change_role',
          user_id: userId,
          role,
          data_access_level: dataAccessLevel
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: data.message,
      });

      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o papel",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirmAction = (user: UserProfile, action: 'activate' | 'deactivate' | 'delete') => {
    const actionTexts = {
      activate: {
        title: 'Ativar Usuário',
        description: `Tem certeza que deseja ativar o usuário ${user.email}? Ele poderá acessar o sistema novamente.`
      },
      deactivate: {
        title: 'Desativar Usuário',
        description: `Tem certeza que deseja desativar o usuário ${user.email}? Ele perderá acesso ao sistema.`
      },
      delete: {
        title: 'Revogar Acesso',
        description: `Tem certeza que deseja revogar completamente o acesso de ${user.email}? Esta ação não pode ser desfeita.`
      }
    };

    setConfirmAction({
      user,
      action,
      ...actionTexts[action]
    });
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
                   <div className="space-y-2">
                     <Label>Nível de Acesso aos Dados</Label>
                      <Select 
                       value={inviteDataAccess} 
                       onValueChange={(value: 'FULL' | 'MASKED' | 'NONE') => setInviteDataAccess(value)}
                     >
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="NONE">Sem Acesso</SelectItem>
                         <SelectItem value="MASKED">Dados Mascarados</SelectItem>
                         <SelectItem value="FULL">Acesso Completo</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancelar
                  </Button>
                   <Button onClick={handleInviteUser} disabled={actionLoading}>
                     {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                     {!actionLoading && <Mail className="h-4 w-4 mr-2" />}
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
          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por e-mail ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(value: 'all' | 'ADMIN' | 'ANALYST' | 'VIEWER') => setRoleFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Papéis</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ANALYST">Analista</SelectItem>
                <SelectItem value="VIEWER">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel & Acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                        ? 'Nenhum usuário encontrado com os filtros aplicados'
                        : 'Nenhum usuário encontrado'
                      }
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.email.split('@')[0]}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getRoleBadge(user.role)}
                        <Badge variant="outline" className="text-xs">
                          {user.data_access_level}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.is_active)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Criado: {new Date(user.created_at).toLocaleDateString('pt-BR')}</div>
                        {user.last_login_at && (
                          <div className="text-muted-foreground text-xs">
                            Login: {new Date(user.last_login_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!user.is_active ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Ativar usuário"
                            onClick={() => openConfirmAction(user, 'activate')}
                            disabled={actionLoading}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10" 
                            title="Desativar usuário"
                            onClick={() => openConfirmAction(user, 'deactivate')}
                            disabled={actionLoading || user.user_id === profile?.user_id}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary-foreground hover:bg-primary/10" 
                          title="Alterar papel"
                          onClick={() => {
                            setRoleChangeUser(user);
                            setIsRoleChangeModalOpen(true);
                          }}
                          disabled={actionLoading}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Change Modal */}
      <RoleChangeModal
        user={roleChangeUser}
        isOpen={isRoleChangeModalOpen}
        onClose={() => {
          setIsRoleChangeModalOpen(false);
          setRoleChangeUser(null);
        }}
        onRoleChange={handleRoleChange}
        loading={actionLoading}
      />

      {/* Confirm Action Modal */}
      {confirmAction && (
        <ConfirmActionModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => handleUserAction(confirmAction.action, confirmAction.user.user_id)}
          title={confirmAction.title}
          description={confirmAction.description}
          confirmText={confirmAction.action === 'delete' ? 'Revogar Acesso' : 'Confirmar'}
          variant={confirmAction.action === 'deactivate' || confirmAction.action === 'delete' ? 'destructive' : 'default'}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default Organization;