import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

export function TrustNote() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Nota de Responsabilidade */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-orange-800 dark:text-orange-200">
                Validação Jurídica Obrigatória
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                O AssistJur.IA facilita a organização e análise dos dados, mas a
                verificação da veracidade das informações nos autos processuais
                permanece responsabilidade exclusiva do usuário jurídico.
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                ⚖️ Sempre confira as informações com os documentos oficiais dos
                processos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nota de Segurança LGPD */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
                Segurança e Privacidade (LGPD)
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Seus dados são processados localmente durante a validação e
                armazenados de forma criptografada. Não compartilhamos
                informações pessoais com terceiros.
              </p>
              <div className="space-y-1 mt-3 text-xs text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Criptografia end-to-end</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Conformidade com LGPD</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🗑️</span>
                  <span>Retenção controlada de dados</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
