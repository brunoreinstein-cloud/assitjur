import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatInterface } from '@/components/ChatInterface';
import { UploadWizard } from '@/components/UploadWizard';
import { LogOut, Database, Shield, User, Upload, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const ChatApp = () => {
  const { user, profile, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: "Tente novamente."
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'default';
      case 'ANALYST':
        return 'secondary';
      case 'VIEWER':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'ANALYST':
        return 'Analista';
      case 'VIEWER':
        return 'Visualizador';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Database className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Hubjuria</span>
              </div>
              
              {/* Base Status - TODO: Replace with actual base info */}
              <Badge variant="outline" className="hidden sm:inline-flex">
                <Database className="h-3 w-3 mr-1" />
                Base v2025.08.25 • 1,234 linhas
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium hidden sm:inline">
                  {profile?.email}
                </span>
                <Badge variant={getRoleBadgeVariant(profile?.role || '')}>
                  {getRoleLabel(profile?.role || '')}
                </Badge>
              </div>

              {/* Admin Access Button */}
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/admin', '_blank')}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Painel Admin
                </Button>
              )}

              {/* Admin Upload Button */}
              {isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="professional" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Atualizar Base</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Atualizar Base de Dados</DialogTitle>
                      <DialogDescription>
                        Faça upload de uma nova planilha CSV/XLSX para atualizar a base de análise.
                      </DialogDescription>
                    </DialogHeader>
                    <UploadWizard 
                      onComplete={() => {
                        toast({
                          title: "Base atualizada",
                          description: "A base de dados foi atualizada com sucesso."
                        });
                      }}
                      onCancel={() => {}}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {/* Logout Button */}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Card for New Users */}
        {!profile?.terms_accepted_at && (
          <Card className="mb-8 border-primary/20 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Bem-vindo ao Hubjuria!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Sistema de análise trabalhista baseado em inteligência artificial. 
                Realize consultas por CNJ, nome de testemunha ou padrões gerais para 
                identificar riscos e irregularidades.
              </p>
              {!isAdmin && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <p className="text-sm text-warning-foreground">
                    <strong>Nota:</strong> Sua conta tem acesso somente para análise e consultas. 
                    Para enviar ou atualizar a base de dados, entre em contato com o administrador.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Non-Admin Warning */}
        {!isAdmin && (
          <div className="mb-6 p-4 bg-accent/50 border border-accent rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>
                Recursos de upload e gestão de base disponíveis somente para administradores.
              </span>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <ChatInterface 
          onUploadClick={() => {
            if (!isAdmin) {
              toast({
                variant: "destructive",
                title: "Acesso restrito",
                description: "Recurso disponível somente para administradores."
              });
            }
          }}
          hasData={true} // TODO: Replace with actual data check
        />
      </main>
    </div>
  );
};

export default ChatApp;