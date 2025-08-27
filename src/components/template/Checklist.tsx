import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const checklistItems = [
  {
    title: 'CNJ tem 20 dígitos',
    description: 'Após retirar máscara (pontos e hífens), deve conter exatamente 20 números'
  },
  {
    title: 'Por Processo: campos obrigatórios',
    description: 'Reclamante_Limpo e Reu_Nome devem estar preenchidos'
  },
  {
    title: 'Por Testemunha: campos obrigatórios',
    description: 'Nome_Testemunha preenchido e CNJs_Como_Testemunha em formato de lista'
  },
  {
    title: 'Configurar "Réu padrão" (opcional)',
    description: 'Para evitar avisos no modo Por Testemunha, defina um réu padrão nas configurações'
  }
];

export function Checklist() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist Pré-Importação</CardTitle>
        <CardDescription>
          Verifique estes itens antes de fazer o upload do seu arquivo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}