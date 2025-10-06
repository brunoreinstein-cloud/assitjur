import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sliders,
  Clock,
  Shield,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SystemConfig = () => {
  // Mock state - will be replaced with real data from Supabase
  const [triangulationWindow, setTriangulationWindow] = useState(6);
  const [cpfMaskEnabled, setCpfMaskEnabled] = useState(true);
  const [scoreWeights, setScoreWeights] = useState({
    reclamante_foi_testemunha: 30,
    troca_direta: 40,
    triangulacao_confirmada: 20,
    prova_emprestada: 10,
  });
  const [exportLimits, setExportLimits] = useState({
    viewer_limit: 50,
    analyst_limit: 1000,
    admin_limit: -1, // unlimited
  });

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "Os parâmetros do sistema foram atualizados com sucesso",
    });
  };

  const handleReset = () => {
    setTriangulationWindow(6);
    setCpfMaskEnabled(true);
    setScoreWeights({
      reclamante_foi_testemunha: 30,
      troca_direta: 40,
      triangulacao_confirmada: 20,
      prova_emprestada: 10,
    });

    toast({
      title: "Configurações restauradas",
      description: "Parâmetros voltaram aos valores padrão",
    });
  };

  const totalWeight = Object.values(scoreWeights).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Parâmetros & Regras
        </h1>
        <p className="text-muted-foreground">
          Configure parâmetros globais do sistema e regras de negócio
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Janela de Triangulação
            </CardTitle>
            <CardDescription>
              Período em meses considerado para análise de triangulação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Meses: {triangulationWindow}</Label>
              <Slider
                value={[triangulationWindow]}
                onValueChange={(value) => setTriangulationWindow(value[0])}
                max={24}
                min={1}
                step={1}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1 mês</span>
                <span>24 meses</span>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Impacto:</strong> Processos e testemunhas dentro de{" "}
                {triangulationWindow} meses serão considerados para
                identificação de padrões suspeitos.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configurações de Privacidade
            </CardTitle>
            <CardDescription>
              Controles de privacidade e proteção de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Máscara de CPF</Label>
                <p className="text-sm text-muted-foreground">
                  Ocultar últimos dígitos do CPF
                </p>
              </div>
              <Switch
                checked={cpfMaskEnabled}
                onCheckedChange={setCpfMaskEnabled}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Exemplo:</strong>{" "}
                {cpfMaskEnabled ? "123.456.789-**" : "123.456.789-00"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Pesos do Score de Risco
          </CardTitle>
          <CardDescription>
            Configure a importância de cada indicador no cálculo do score final
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Reclamante foi Testemunha:{" "}
                  {scoreWeights.reclamante_foi_testemunha}%
                </Label>
                <Slider
                  value={[scoreWeights.reclamante_foi_testemunha]}
                  onValueChange={(value) =>
                    setScoreWeights((prev) => ({
                      ...prev,
                      reclamante_foi_testemunha: value[0],
                    }))
                  }
                  max={100}
                  min={0}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Troca Direta: {scoreWeights.troca_direta}%</Label>
                <Slider
                  value={[scoreWeights.troca_direta]}
                  onValueChange={(value) =>
                    setScoreWeights((prev) => ({
                      ...prev,
                      troca_direta: value[0],
                    }))
                  }
                  max={100}
                  min={0}
                  step={5}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Triangulação Confirmada:{" "}
                  {scoreWeights.triangulacao_confirmada}%
                </Label>
                <Slider
                  value={[scoreWeights.triangulacao_confirmada]}
                  onValueChange={(value) =>
                    setScoreWeights((prev) => ({
                      ...prev,
                      triangulacao_confirmada: value[0],
                    }))
                  }
                  max={100}
                  min={0}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Prova Emprestada: {scoreWeights.prova_emprestada}%
                </Label>
                <Slider
                  value={[scoreWeights.prova_emprestada]}
                  onValueChange={(value) =>
                    setScoreWeights((prev) => ({
                      ...prev,
                      prova_emprestada: value[0],
                    }))
                  }
                  max={100}
                  min={0}
                  step={5}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Total dos pesos:</span>
            <Badge variant={totalWeight === 100 ? "default" : "destructive"}>
              {totalWeight}%
            </Badge>
            {totalWeight !== 100 && (
              <span className="text-sm text-muted-foreground">
                (deve somar 100%)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limites de Export por Papel</CardTitle>
          <CardDescription>
            Configure limites de exportação por tipo de usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>VIEWER - Registros por export</Label>
              <Input
                type="number"
                value={exportLimits.viewer_limit}
                onChange={(e) =>
                  setExportLimits((prev) => ({
                    ...prev,
                    viewer_limit: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>ANALYST - Registros por export</Label>
              <Input
                type="number"
                value={exportLimits.analyst_limit}
                onChange={(e) =>
                  setExportLimits((prev) => ({
                    ...prev,
                    analyst_limit: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>ADMIN - Registros por export</Label>
              <Select
                value={
                  exportLimits.admin_limit === -1 ? "unlimited" : "limited"
                }
                onValueChange={(value) =>
                  setExportLimits((prev) => ({
                    ...prev,
                    admin_limit: value === "unlimited" ? -1 : 10000,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Ilimitado</SelectItem>
                  <SelectItem value="limited">Com limite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar Padrões
        </Button>
      </div>
    </div>
  );
};

export default SystemConfig;
