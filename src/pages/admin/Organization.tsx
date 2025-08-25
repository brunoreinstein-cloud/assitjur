import React, { useState } from 'react';
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
  Shield
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Organization = () => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');

  // Mock data - will be replaced with real data from Supabase
  const orgData = {
    name: 'Escritório Demo',
    code: 'DEMO001',
    domain: 'demo.com',
    require2FA: false,
    exportLimit: 'ROLE_BASED',
    retentionMonths: 24
  };

  const users = [
    {
      id: '1',
      email: 'admin@demo.com',
      role: 'ADMIN',
      status: 'active',
      lastAccess: '2024-01-15 14:30',
      name: 'Administrador'
    },
    {
      id: '2',
      email: 'analyst@demo.com',
      role: 'ANALYST',
      status: 'active',
      lastAccess: '2024-01-14 16:20',
      name: 'Analista'
    },
    {
      id: '3',
      email: 'viewer@demo.com',
      role: 'VIEWER',
      status: 'active',
      lastAccess: '2024-01-13 09:15',
      name: 'Visualizador'
    },
    {
      id: '4',
      email: 'pending@demo.com',
      role: 'VIEWER',
      status: 'pending',
      lastAccess: null,
      name: 'Usuário Pendente'
    }
  ];

  const handleInviteUser = () => {
    if (!inviteEmail) return;
    
    toast({
      title: "Convite enviado",
      description: `Convite enviado para ${inviteEmail} com perfil ${inviteRole}`,
    });
    
    setIsInviteDialogOpen(false);
    setInviteEmail('');
    setInviteRole('VIEWER');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="default" className="bg-red-500">Admin</Badge>;
      case 'ANALYST':
        return <Badge variant="default" className="bg-blue-500">Analista</Badge>;
      case 'VIEWER':
        return <Badge variant="secondary">Visualizador</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
                <Input id="orgName" value={orgData.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgCode">Código</Label>
                <Input id="orgCode" value={orgData.code} disabled />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="domain">Domínio Permitido</Label>
              <Input id="domain" value={orgData.domain} placeholder="exemplo.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Retenção de Dados (meses)</Label>
              <Input id="retention" type="number" value={orgData.retentionMonths} />
            </div>

            <Button className="w-full">Salvar Alterações</Button>
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
              <Switch checked={orgData.require2FA} />
            </div>

            <div className="space-y-2">
              <Label>Limite de Export</Label>
              <Select value={orgData.exportLimit}>
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
                    <Select value={inviteRole} onValueChange={setInviteRole}>
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
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell>
                    {user.lastAccess || 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-orange-600">
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
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