import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

export function TrustNote() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Validação nos autos é obrigatória.</p>
              <p className="text-sm text-muted-foreground mt-1">
                O HubJUR.IA facilita a organização dos dados, mas a verificação da veracidade das informações nos autos processuais permanece responsabilidade do usuário.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">LGPD by design</p>
              <p className="text-sm text-muted-foreground mt-1">
                Seus dados serão usados apenas para processamento de importação, conforme LGPD. O sistema não armazena informações pessoais desnecessariamente.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}