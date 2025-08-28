import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Info, 
  FileText, 
  Download,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImportHelpPanelProps {
  currentStep: 'upload' | 'validation' | 'preview' | 'publish';
  validationResults?: any;
}

const ImportHelpPanel: React.FC<ImportHelpPanelProps> = ({
  currentStep,
  validationResults
}) => {
  const getStepHelp = () => {
    switch (currentStep) {
      case 'upload':
        return {
          title: 'Como fazer o upload',
          icon: FileText,
          tips: [
            'Arraste e solte o arquivo ou clique para selecionar',
            'Formatos aceitos: CSV, XLS, XLSX',
            'Tamanho máximo: 10MB',
            'Use nosso template para evitar erros'
          ],
          actions: (
            <Button variant="outline" size="sm" asChild>
              <a href="/template-base-exemplo.csv" download="template-base-exemplo.csv">
                <Download className="h-4 w-4 mr-2" />
                Baixar Template
              </a>
            </Button>
          )
        };
      
      case 'validation':
        return {
          title: 'Entendendo a validação',
          icon: CheckCircle,
          tips: [
            'CNJs devem ter 20 dígitos com verificadores válidos',
            'Campos obrigatórios: CNJ, Reclamante, Réu',
            'Duplicatas são detectadas automaticamente',
            'Erros impedem a publicação, avisos são permitidos'
          ],
          actions: validationResults?.errors?.length > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{validationResults.errors.length} erros encontrados.</strong> 
                Corrija-os antes de continuar.
              </AlertDescription>
            </Alert>
          ) : validationResults?.validRows > 0 ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Pronto!</strong> {validationResults.validRows} registros válidos.
              </AlertDescription>
            </Alert>
          ) : null
        };
      
      case 'preview':
        return {
          title: 'Prévia dos dados',
          icon: Info,
          tips: [
            'Visualize os dados que serão importados',
            'Confira as métricas de qualidade',
            'Esta é sua última chance de revisar',
            'A publicação substituirá a base atual'
          ],
          actions: validationResults ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {validationResults.validRows} registros válidos
                </Badge>
                <Badge variant="outline">
                  {Math.round((validationResults.validRows / validationResults.totalRows) * 100)}% taxa de sucesso
                </Badge>
              </div>
            </div>
          ) : null
        };
      
      case 'publish':
        return {
          title: 'Publicando a base',
          icon: CheckCircle,
          tips: [
            'A nova versão substituirá a base ativa',
            'Todas as consultas usarão os novos dados',
            'O processo é irreversível',
            'Mantenha backup dos dados anteriores'
          ],
          actions: (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Esta operação substituirá permanentemente a base de dados atual.
              </AlertDescription>
            </Alert>
          )
        };
      
      default:
        return null;
    }
  };

  const stepHelp = getStepHelp();
  if (!stepHelp) return null;

  const IconComponent = stepHelp.icon;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IconComponent className="h-5 w-5" />
          {stepHelp.title}
        </CardTitle>
        <CardDescription>
          Dicas para esta etapa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {stepHelp.tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{tip}</span>
            </div>
          ))}
        </div>
        
        {stepHelp.actions && (
          <div className="pt-2 border-t">
            {stepHelp.actions}
          </div>
        )}

        {/* Informações específicas do contexto */}
        {currentStep === 'validation' && validationResults && (
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted p-2 rounded">
                <div className="font-medium text-lg">{validationResults.totalRows}</div>
                <div className="text-muted-foreground">Total analisado</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                <div className="font-medium text-lg text-green-600">
                  {validationResults.validRows}
                </div>
                <div className="text-muted-foreground">Válidos</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportHelpPanel;