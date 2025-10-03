import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const checklistItems = [
  {
    title: "Mapeamento Estrito de Colunas",
    description:
      "Use EXATAMENTE os nomes das colunas: CNJ, Reclamante_Limpo, Reu_Nome, Nome_Testemunha, CNJs_Como_Testemunha",
    category: "critical",
  },
  {
    title: "CNJ com 20 Dígitos Válidos",
    description:
      "CNJ deve ter exatamente 20 dígitos após remover pontos e hífens. Dígitos verificadores devem estar corretos",
    category: "critical",
  },
  {
    title: "Campos Obrigatórios - Por Processo",
    description:
      "CNJ, Reclamante_Limpo e Reu_Nome são obrigatórios e não podem estar vazios",
    category: "required",
  },
  {
    title: "Campos Obrigatórios - Por Testemunha",
    description:
      "Nome_Testemunha e CNJs_Como_Testemunha são obrigatórios. Lista deve conter ao menos um CNJ válido",
    category: "required",
  },
  {
    title: "Formato de Lista para CNJs",
    description:
      'CNJs_Como_Testemunha aceita: ["CNJ1","CNJ2"], CNJ1;CNJ2 ou CNJ1,CNJ2',
    category: "format",
  },
  {
    title: "Validação Pré-Envio",
    description:
      "Sistema bloqueará importação se houver erros. Corrija todos os problemas antes de continuar",
    category: "validation",
  },
  {
    title: "Abas Corretas no Excel",
    description:
      'Use abas nomeadas "Por Processo" e "Por Testemunha" (case-sensitive)',
    category: "format",
  },
  {
    title: "Backup dos Dados Originais",
    description: "Mantenha uma cópia dos dados originais antes da importação",
    category: "safety",
  },
];

const categoryColors = {
  critical:
    "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800",
  required:
    "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800",
  format:
    "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800",
  validation:
    "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800",
  safety:
    "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800",
};

const categoryIcons = {
  critical: "🔴",
  required: "⚠️",
  format: "📋",
  validation: "✅",
  safety: "🛡️",
};

export function Checklist() {
  const groupedItems = checklistItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof checklistItems>,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Checklist de Validação Rigorosa
        </CardTitle>
        <CardDescription>
          Siga este checklist para garantir que seus dados passem pela validação
          automática
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <span className="text-base">
                  {categoryIcons[category as keyof typeof categoryIcons]}
                </span>
                {category === "critical" && "CRÍTICO"}
                {category === "required" && "OBRIGATÓRIO"}
                {category === "format" && "FORMATO"}
                {category === "validation" && "VALIDAÇÃO"}
                {category === "safety" && "SEGURANÇA"}
              </h4>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${categoryColors[item.category as keyof typeof categoryColors]}`}
                  >
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-sm opacity-90">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
