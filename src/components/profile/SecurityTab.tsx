import { Shield, Key, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SecurityTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Autenticação de Dois Fatores (2FA)
          </h3>
        </div>

        <Alert className="mb-4">
          <AlertDescription>
            Adicione uma camada extra de segurança à sua conta com autenticação
            de dois fatores.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="2fa-toggle">Ativar 2FA</Label>
            <p className="text-sm text-muted-foreground">
              Use um aplicativo de autenticação para gerar códigos
            </p>
          </div>
          <Switch id="2fa-toggle" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Senha</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Altere sua senha regularmente para manter sua conta segura
        </p>

        <Button variant="outline">Alterar Senha</Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <LogOut className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Sessões Ativas</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Gerencie dispositivos conectados à sua conta
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Navegador atual</p>
              <p className="text-sm text-muted-foreground">
                Última atividade: agora
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              Encerrar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
