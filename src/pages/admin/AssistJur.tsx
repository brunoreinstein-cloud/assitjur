import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessosExplorer } from '@/components/admin/processos/ProcessosExplorer';
import { AssistJurUploadWizard } from '@/components/assistjur/AssistJurUploadWizard';
import { ReviewUpdateButton } from '@/components/admin/ReviewUpdateButton';
import { BarChart3, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AssistJur() {
  const { } = useAuth();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AssistJur.IA</h1>
          <p className="text-muted-foreground mt-1">
            Pipeline de análise inteligente de testemunhas e detecção de padrões suspeitos
          </p>
        </div>
        <div className="flex gap-2">
          <ReviewUpdateButton 
            orgId="current-org-id"
          />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Status do Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-success/10 text-success">
                ✅ OPERACIONAL
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Engine Analítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div>✅ Triangulação</div>
              <div>✅ Troca Direta</div>
              <div>✅ Duplo Papel</div>
              <div>✅ Prova Emprestada</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Reconciliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div>✅ CNJs Stubs</div>
              <div>✅ Sinônimos</div>
              <div>✅ Normalização</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Validação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div>✅ Issues Table</div>
              <div>✅ Export CSV</div>
              <div>✅ LGPD Compliant</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados Processados</TabsTrigger>
          <TabsTrigger value="upload">Importar Excel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dados">
          <ProcessosExplorer />
        </TabsContent>
        
        <TabsContent value="upload">
          <AssistJurUploadWizard />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">Pipeline AssistJur.IA - Funcionalidades:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>ETL & Validação:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Sistema de sinônimos inteligente</li>
                  <li>• Parser robusto de listas</li>
                  <li>• Reconciliação automática de CNJs</li>
                  <li>• Validação bloqueante de campos obrigatórios</li>
                </ul>
              </div>
              <div>
                <strong>Engine Analítico:</strong>
                <ul className="mt-1 space-y-1">
              <li>• Detecção de triangulação A-B-C-A</li>
                  <li>• Análise de troca direta recíproca</li>
                  <li>• Identificação de duplo papel</li>
                  <li>• Prova emprestada (mais de 10 depoimentos)</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-xs bg-warning/10 p-2 rounded border-l-4 border-warning">
              <strong>LGPD:</strong> Todos os dados são mascarados conforme políticas RLS. 
              CPFs nunca são exibidos completos. Validação nos autos é sempre obrigatória.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}