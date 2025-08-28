import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TemplateDownload = () => {
  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/template-base-exemplo.csv';
    link.download = 'template-base-exemplo.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Template de Exemplo
        </CardTitle>
        <CardDescription>
          Baixe o modelo com dados de exemplo para testar o upload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>✅ Template atualizado!</strong> Este arquivo contém 10 registros com CNJs válidos e todas as colunas esperadas pelo sistema.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Colunas incluídas no template:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span><strong>CNJ</strong> (obrigatório)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Comarca</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Tribunal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Vara</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Fase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Status</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span><strong>Reclamante_Limpo</strong> (obrigatório)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Reclamante CPF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span><strong>Reu_Nome</strong> (obrigatório)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Data Audiência</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Observações</span>
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Dicas importantes:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✅ <strong>CNJs agora são validados</strong> - dígitos verificadores corretos</li>
            <li>• Mantenha o formato CSV para melhor performance</li>
            <li>• Use no máximo 10.000 linhas por arquivo (10MB)</li>
            <li>• CNJ deve ter 20 dígitos: 1000000-91.2024.5.02.1000</li>
            <li>• CPF será automaticamente mascarado por segurança</li>
            <li>• Datas no formato YYYY-MM-DD ou DD/MM/YYYY</li>
            <li>• Campos obrigatórios: CNJ, Reclamante_Limpo, Reu_Nome</li>
          </ul>
        </div>

        <Button onClick={handleDownloadTemplate} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Baixar Template de Exemplo
        </Button>
      </CardContent>
    </Card>
  );
};

export default TemplateDownload;