import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";

interface ROIInputs {
  funcionarios: number;
  processos: number;
  consultoriaAtual: number;
}

export function ComplianceROI() {
  const [inputs, setInputs] = useState<ROIInputs>({
    funcionarios: 10,
    processos: 50,
    consultoriaAtual: 25000,
  });

  const calculateROI = () => {
    // Custos tradicionais
    const consultoriaTradicional = inputs.consultoriaAtual;
    const implementacao = consultoriaTradicional * 1.8; // 180% do valor da consultoria
    const auditoria = consultoriaTradicional * 0.6; // 60% anual
    const manutencao = consultoriaTradicional * 0.5; // 50% anual
    const totalTradicional =
      consultoriaTradicional + implementacao + auditoria + manutencao;

    // Custos AssistJur.IA
    const licencaAnual = Math.max(24000, inputs.funcionarios * 2400); // R$ 2.400 por usuário/ano
    const setupAssistjur = 2000;
    const totalAssistjur = licencaAnual + setupAssistjur;

    // Economia
    const economia = totalTradicional - totalAssistjur;
    const percentualEconomia = (economia / totalTradicional) * 100;

    return {
      totalTradicional,
      totalAssistjur,
      economia,
      percentualEconomia,
      tempoEconomizado: 85, // 85% menos tempo
    };
  };

  const roi = calculateROI();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <CardTitle>Calculadora de ROI - Compliance LGPD</CardTitle>
        </div>
        <CardDescription>
          Descubra quanto você pode economizar com compliance automatizada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="funcionarios">Funcionários</Label>
            <Input
              id="funcionarios"
              type="number"
              value={inputs.funcionarios}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  funcionarios: parseInt(e.target.value) || 0,
                })
              }
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="processos">Processos/mês</Label>
            <Input
              id="processos"
              type="number"
              value={inputs.processos}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  processos: parseInt(e.target.value) || 0,
                })
              }
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultoria">Custo Consultoria Atual (R$)</Label>
            <Input
              id="consultoria"
              type="number"
              value={inputs.consultoriaAtual}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  consultoriaAtual: parseInt(e.target.value) || 0,
                })
              }
              min="0"
            />
          </div>
        </div>

        {/* Comparação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Método Tradicional */}
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-destructive">
                Método Tradicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Consultoria inicial:</span>
                <span>R$ {inputs.consultoriaAtual.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Implementação:</span>
                <span>
                  R$ {(inputs.consultoriaAtual * 1.8).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Auditoria anual:</span>
                <span>
                  R$ {(inputs.consultoriaAtual * 0.6).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Manutenção anual:</span>
                <span>
                  R$ {(inputs.consultoriaAtual * 0.5).toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-destructive">
                  <span>Total (1º ano):</span>
                  <span>R$ {roi.totalTradicional.toLocaleString()}</span>
                </div>
              </div>
              <Badge variant="destructive" className="w-full justify-center">
                6+ meses de implementação
              </Badge>
            </CardContent>
          </Card>

          {/* AssistJur.IA */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-primary">
                AssistJur.IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Setup inicial:</span>
                <span>R$ 2.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Licença anual:</span>
                <span>
                  R${" "}
                  {Math.max(24000, inputs.funcionarios * 2400).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Suporte:</span>
                <span className="text-primary">Incluído</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Atualizações:</span>
                <span className="text-primary">Automáticas</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-primary">
                  <span>Total (1º ano):</span>
                  <span>R$ {roi.totalAssistjur.toLocaleString()}</span>
                </div>
              </div>
              <Badge variant="default" className="w-full justify-center">
                1 semana de setup
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                  <DollarSign className="w-6 h-6" />
                  R$ {roi.economia.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Economia total
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-accent">
                  <TrendingUp className="w-6 h-6" />
                  {roi.percentualEconomia.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Redução de custos
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {roi.tempoEconomizado}%
                </div>
                <div className="text-sm text-muted-foreground">Menos tempo</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button size="lg" className="mr-2">
                Solicitar Demonstração
              </Button>
              <Button variant="outline" size="lg">
                Baixar Relatório Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Benefícios Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-primary">Benefícios Inclusos:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Anonimização automática de PII</li>
              <li>✓ Auditoria 24/7 automática</li>
              <li>✓ Políticas de retenção configuráveis</li>
              <li>✓ Portal LGPD para titulares</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-accent">Riscos Eliminados:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Multas ANPD (até R$ 50 milhões)</li>
              <li>✓ Exposição de dados pessoais</li>
              <li>✓ Não conformidade com CNJ</li>
              <li>✓ Perda de credibilidade</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
