import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, Settings, DollarSign, Clock, Brain } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AVAILABLE_MODELS = [
  {
    id: "gpt-5-2025-08-07",
    name: "GPT-5",
    description: "Modelo mais avançado e inteligente",
    costPer1k: 0.15,
    speed: "Rápido",
    category: "flagship",
  },
  {
    id: "gpt-5-mini-2025-08-07",
    name: "GPT-5 Mini",
    description: "Versão otimizada do GPT-5",
    costPer1k: 0.08,
    speed: "Muito Rápido",
    category: "flagship",
  },
  {
    id: "gpt-4.1-2025-04-14",
    name: "GPT-4.1",
    description: "Modelo confiável para resultados consistentes",
    costPer1k: 0.1,
    speed: "Rápido",
    category: "reliable",
  },
  {
    id: "o3-2025-04-16",
    name: "O3",
    description: "Modelo de raciocínio para problemas complexos",
    costPer1k: 0.25,
    speed: "Lento",
    category: "reasoning",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Modelo legado rápido e econômico",
    costPer1k: 0.02,
    speed: "Muito Rápido",
    category: "legacy",
  },
];

const OpenAIModels = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    model: "gpt-4o-mini",
    fallback: [] as string[],
    temperature: 0.7,
    top_p: 0.9,
    max_output_tokens: 2000,
    streaming: false,
    rate_per_min: 60,
    budget_month_cents: 10000,
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["org-settings", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("*")
        .eq("org_id", profile?.organization_id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  // Update settings when data changes
  React.useEffect(() => {
    if (currentSettings) {
      setSettings({
        model: currentSettings.model,
        fallback: currentSettings.fallback || [],
        temperature: currentSettings.temperature,
        top_p: currentSettings.top_p,
        max_output_tokens: currentSettings.max_output_tokens,
        streaming: currentSettings.streaming,
        rate_per_min: currentSettings.rate_per_min,
        budget_month_cents: currentSettings.budget_month_cents,
      });
    }
  }, [currentSettings]);

  // Save settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      const { error } = await supabase.functions.invoke(
        "admin-openai-settings",
        {
          body: {
            action: "update_models",
            settings: newSettings,
            org_id: profile?.organization_id,
          },
        },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      toast({
        title: "Configurações salvas",
        description: "Modelos e parâmetros foram atualizados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao salvar: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === settings.model);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurar Modelos</h1>
          <p className="text-muted-foreground">
            Selecione modelos, configure parâmetros e defina limites
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveSettingsMutation.isPending}>
          {saveSettingsMutation.isPending
            ? "Salvando..."
            : "Salvar Configurações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Seleção de Modelo</span>
            </CardTitle>
            <CardDescription>
              Escolha o modelo principal e fallbacks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Modelo Principal</Label>
              <Select
                value={settings.model}
                onValueChange={(value) =>
                  setSettings({ ...settings, model: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {model.description}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          ${model.costPer1k}/1k
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedModel && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span>${selectedModel.costPer1k}/1k tokens</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{selectedModel.speed}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span className="capitalize">{selectedModel.category}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedModel.description}
                </p>
              </div>
            )}

            <div>
              <Label>Modelos de Fallback (ordem de prioridade)</Label>
              <div className="space-y-2 mt-2">
                {settings.fallback.map((modelId, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span>
                      {AVAILABLE_MODELS.find((m) => m.id === modelId)?.name ||
                        modelId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFallback = [...settings.fallback];
                        newFallback.splice(index, 1);
                        setSettings({ ...settings, fallback: newFallback });
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <Select
                  onValueChange={(value) => {
                    if (
                      !settings.fallback.includes(value) &&
                      value !== settings.model
                    ) {
                      setSettings({
                        ...settings,
                        fallback: [...settings.fallback, value],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar fallback" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.filter(
                      (m) =>
                        m.id !== settings.model &&
                        !settings.fallback.includes(m.id),
                    ).map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Parâmetros do Modelo</span>
            </CardTitle>
            <CardDescription>
              Configure a personalidade e comportamento da IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.temperature}
                </span>
              </div>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, temperature: value })
                }
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = mais determinístico, 2 = mais criativo
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Top P</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.top_p}
                </span>
              </div>
              <Slider
                value={[settings.top_p]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, top_p: value })
                }
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Controla a diversidade da resposta
              </p>
            </div>

            <div>
              <Label htmlFor="max_tokens">Máximo de Tokens na Resposta</Label>
              <Input
                id="max_tokens"
                type="number"
                value={settings.max_output_tokens}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_output_tokens: parseInt(e.target.value) || 2000,
                  })
                }
                min={100}
                max={4000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Limita o tamanho da resposta (100-4000)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Streaming</Label>
                <p className="text-xs text-muted-foreground">
                  Resposta em tempo real
                </p>
              </div>
              <Switch
                checked={settings.streaming}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, streaming: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limiting & Budget */}
      <Card>
        <CardHeader>
          <CardTitle>Limites e Orçamento</CardTitle>
          <CardDescription>
            Configure rate limiting e controles de custo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="rate_limit">
                Rate Limit (requisições/minuto)
              </Label>
              <Input
                id="rate_limit"
                type="number"
                value={settings.rate_per_min}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rate_per_min: parseInt(e.target.value) || 60,
                  })
                }
                min={1}
                max={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Limite de requisições por minuto por usuário
              </p>
            </div>

            <div>
              <Label htmlFor="budget">Orçamento Mensal (centavos USD)</Label>
              <Input
                id="budget"
                type="number"
                value={settings.budget_month_cents}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    budget_month_cents: parseInt(e.target.value) || 10000,
                  })
                }
                min={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Limite de gasto mensal em centavos ($
                {(settings.budget_month_cents / 100).toFixed(2)})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Guidelines */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Guia de Modelos</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <div>
            <strong>GPT-5:</strong> Use para casos que exigem máxima
            inteligência e raciocínio complexo
          </div>
          <div>
            <strong>GPT-5 Mini:</strong> Ideal para a maioria dos casos,
            balanceando qualidade e velocidade
          </div>
          <div>
            <strong>GPT-4.1:</strong> Confiável para resultados consistentes e
            bem testados
          </div>
          <div>
            <strong>O3:</strong> Especificamente para problemas que requerem
            raciocínio profundo
          </div>
          <div>
            <strong>GPT-4o Mini:</strong> Para casos simples onde velocidade e
            custo são prioridade
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenAIModels;
