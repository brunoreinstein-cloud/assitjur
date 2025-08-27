import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatStore, QueryKind, Language, ExportType } from '@/stores/useChatStore';
import { Search, User, Building, Shield, HelpCircle, Settings, Globe, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const QUERY_TYPES = [
  { kind: 'processo' as QueryKind, label: 'Por Processo', icon: Search, description: 'Buscar por número CNJ' },
  { kind: 'testemunha' as QueryKind, label: 'Por Testemunha', icon: User, description: 'Analisar pessoa específica' },
  { kind: 'reclamante' as QueryKind, label: 'Por Reclamante', icon: Building, description: 'Buscar por empresa/pessoa jurídica' },
];

export function RightPanel() {
  const { kind, defaults, setKind, setDefaults } = useChatStore();

  return (
    <div className="w-80 border-l bg-card/50 backdrop-blur-sm overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Tipos de Consulta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4" />
              Tipos de Consulta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUERY_TYPES.map((type) => (
              <Button
                key={type.kind}
                variant={kind === type.kind ? "default" : "outline"}
                size="sm"
                onClick={() => setKind(type.kind)}
                className="w-full justify-start h-auto p-3"
              >
                <div className="flex items-start gap-3">
                  <type.icon className="h-4 w-4 mt-0.5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Configurações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-2">
                <Globe className="h-3 w-3" />
                Idioma
              </Label>
              <Select 
                value={defaults.language} 
                onValueChange={(value: Language) => setDefaults({ language: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-2">
                <Download className="h-3 w-3" />
                Exportação Padrão
              </Label>
              <Select 
                value={defaults.export} 
                onValueChange={(value: ExportType) => setDefaults({ export: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="reports" className="text-xs flex items-center gap-2">
                <Settings className="h-3 w-3" />
                Relatórios Agendados
              </Label>
              <Switch id="reports" disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              Em breve: configuração de relatórios automáticos
            </p>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
              <Shield className="h-4 w-4" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-amber-200 bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-xs">
                <strong>Validação obrigatória:</strong> Os resultados apresentados são assistivos e requerem 
                validação nos autos. Este sistema não substitui análise jurídica especializada.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Tooltip de Apoio */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
              <HelpCircle className="h-4 w-4" />
              Como Interpretar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-blue-800">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">📌</Badge>
              <span>Resumo Executivo: Visão geral dos achados</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">📋</Badge>
              <span>Análise Detalhada: Dados e conexões identificadas</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">⚠️</Badge>
              <span>Alertas: Padrões suspeitos que requerem atenção</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">🎯</Badge>
              <span>Estratégias: Recomendações para a defesa</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}