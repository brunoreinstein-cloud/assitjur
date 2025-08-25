import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { FileText, Plus, Edit, History, FlaskConical, GitBranch, Lock, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TEMPLATE_TYPES = [
  { id: 'processo', name: 'Processo (CNJ)', description: 'Consultas por número de processo' },
  { id: 'testemunha', name: 'Testemunha (Nome)', description: 'Consultas por nome de testemunha' },
  { id: 'general', name: 'Padrões Gerais', description: 'Consultas gerais na base' }
];

const SYSTEM_GUARDS = [
  "Basear exclusivamente nos dados da planilha fornecida",
  "Não inventar ou inferir dados não presentes na base",
  "Sempre mascarar números de CPF no formato XXX.XXX.XXX-XX",
  'Responder "não consta na base fornecida" quando dados não estão disponíveis',
  "Incluir rodapé obrigatório sobre validação nos autos"
];

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente especializado em análise de dados jurídicos. Sua função é consultar e analisar informações de uma planilha de processos e pessoas fornecida pelo usuário.

REGRAS FUNDAMENTAIS (NÃO EDITÁVEIS):
${SYSTEM_GUARDS.map(guard => `- ${guard}`).join('\n')}

VARIÁVEIS DISPONÍVEIS:
- {cnj} - Número do processo
- {nome} - Nome da pessoa
- {comarca} - Comarca do processo
- {ano} - Ano de referência
- {janelaTriangulacao} - Período para análise de triangulação
- {politicaLGPD} - Diretrizes de proteção de dados

Sempre responda no formato JSON estruturado solicitado e inclua o rodapé obrigatório: "Informações baseadas na planilha carregada. Recomenda-se validação nos autos antes de qualquer medida processual."`;

const PromptStudio = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [abWeights, setAbWeights] = useState({ v1: 80, v2: 20 });
  const [newPrompt, setNewPrompt] = useState({
    label: '',
    content: DEFAULT_SYSTEM_PROMPT,
    template_type: 'general'
  });

  // Fetch prompts
  const { data: prompts, isLoading } = useQuery({
    queryKey: ['prompts', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('org_id', profile?.organization_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch active settings
  const { data: settings } = useQuery({
    queryKey: ['org-settings', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_settings')
        .select('prompt_active_id, ab_weights')
        .eq('org_id', profile?.organization_id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  // Create prompt
  const createPromptMutation = useMutation({
    mutationFn: async (promptData: typeof newPrompt) => {
      const { error } = await supabase.functions.invoke('admin-prompts', {
        body: { 
          action: 'create',
          ...promptData,
          org_id: profile?.organization_id 
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setIsCreateDialogOpen(false);
      setNewPrompt({ label: '', content: DEFAULT_SYSTEM_PROMPT, template_type: 'general' });
      toast({
        title: "Prompt criado",
        description: "Nova versão de prompt foi salva.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao criar prompt: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Activate prompt
  const activatePromptMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const { error } = await supabase.functions.invoke('admin-prompts', {
        body: { 
          action: 'activate',
          promptId,
          org_id: profile?.organization_id 
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: "Prompt ativado",
        description: "Prompt está agora ativo para consultas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao ativar prompt: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update A/B weights
  const updateAbWeightsMutation = useMutation({
    mutationFn: async (weights: typeof abWeights) => {
      const { error } = await supabase.functions.invoke('admin-prompts', {
        body: { 
          action: 'update_ab_weights',
          weights,
          org_id: profile?.organization_id 
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      toast({
        title: "A/B Test atualizado",
        description: "Pesos de distribuição foram salvos.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar A/B: " + error.message,
        variant: "destructive",
      });
    },
  });

  const activePrompt = prompts?.find(p => p.id === settings?.prompt_active_id);
  const promptsByType = prompts?.reduce((acc, prompt) => {
    if (!acc[prompt.template_type]) acc[prompt.template_type] = [];
    acc[prompt.template_type].push(prompt);
    return acc;
  }, {} as Record<string, any[]>) || {};

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
          <h1 className="text-3xl font-bold">Prompt Studio</h1>
          <p className="text-muted-foreground">
            Gerencie prompts do sistema, templates e testes A/B
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Versão de Prompt</DialogTitle>
              <DialogDescription>
                Configure um novo template de prompt para sua organização
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="label">Nome do Prompt</Label>
                  <Input
                    id="label"
                    placeholder="Ex: Análise CNJ v2.1"
                    value={newPrompt.label}
                    onChange={(e) => setNewPrompt({ ...newPrompt, label: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Tipo de Template</Label>
                  <Select
                    value={newPrompt.template_type}
                    onValueChange={(value) => setNewPrompt({ ...newPrompt, template_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="content">Conteúdo do Prompt</Label>
                <Textarea
                  id="content"
                  className="min-h-[300px] font-mono text-sm"
                  value={newPrompt.content}
                  onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use variáveis como {"{cnj}"}, {"{nome}"}, {"{comarca}"}, etc.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createPromptMutation.mutate(newPrompt)}
                disabled={!newPrompt.label || !newPrompt.content || createPromptMutation.isPending}
              >
                {createPromptMutation.isPending ? "Criando..." : "Criar Prompt"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="system">Sistema Global</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="variables">Variáveis</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Active Prompt */}
          {activePrompt && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Ativo</Badge>
                    <CardTitle className="text-green-800">{activePrompt.label}</CardTitle>
                  </div>
                  <div className="text-sm text-green-700">
                    v{activePrompt.version} • {TEMPLATE_TYPES.find(t => t.id === activePrompt.template_type)?.name}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap text-green-800">
                  {activePrompt.content.substring(0, 200)}...
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompts by Type */}
          {TEMPLATE_TYPES.map((type) => (
            <Card key={type.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{type.name}</span>
                </CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {!promptsByType[type.id]?.length ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum prompt para este tipo</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Versão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promptsByType[type.id].map((prompt) => (
                        <TableRow key={prompt.id}>
                          <TableCell className="font-medium">{prompt.label}</TableCell>
                          <TableCell>v{prompt.version}</TableCell>
                          <TableCell>
                            <Badge variant={prompt.is_active ? "default" : "secondary"}>
                              {prompt.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(prompt.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPrompt(prompt)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!prompt.is_active && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => activatePromptMutation.mutate(prompt.id)}
                                  disabled={activatePromptMutation.isPending}
                                >
                                  Ativar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {/* System Guards */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <Lock className="h-5 w-5" />
                <span>Guards do Sistema (Não Editáveis)</span>
              </CardTitle>
              <CardDescription className="text-red-700">
                Regras de segurança aplicadas automaticamente a todos os prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {SYSTEM_GUARDS.map((guard, index) => (
                  <div key={index} className="flex items-start space-x-2 text-red-800">
                    <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{guard}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Prompt Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt do Sistema Global</CardTitle>
              <CardDescription>
                Base aplicada a todos os prompts da organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {DEFAULT_SYSTEM_PROMPT}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5" />
                <span>Teste A/B de Prompts</span>
              </CardTitle>
              <CardDescription>
                Configure distribuição de tráfego entre diferentes versões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Versão 1 (Principal)</Label>
                  <span className="text-sm text-muted-foreground">{abWeights.v1}%</span>
                </div>
                <Slider
                  value={[abWeights.v1]}
                  onValueChange={([value]) => setAbWeights({ v1: value, v2: 100 - value })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Versão 2 (Teste)</Label>
                  <span className="text-sm text-muted-foreground">{abWeights.v2}%</span>
                </div>
                <Slider
                  value={[abWeights.v2]}
                  onValueChange={([value]) => setAbWeights({ v1: 100 - value, v2: value })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Total: {abWeights.v1 + abWeights.v2}%
                </div>
                <Button
                  onClick={() => updateAbWeightsMutation.mutate(abWeights)}
                  disabled={updateAbWeightsMutation.isPending}
                >
                  {updateAbWeightsMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* A/B Metrics would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
              <CardDescription>
                Comparação entre versões (últimos 7 dias)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Dados insuficientes para análise</p>
                <p className="text-sm">Execute mais testes para ver métricas comparativas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variáveis Disponíveis</CardTitle>
              <CardDescription>
                Use estas variáveis em seus prompts para dados dinâmicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{"{cnj}"}</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Número do processo CNJ formatado
                    </p>
                  </div>
                  <div>
                    <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{"{nome}"}</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nome da pessoa para consulta
                    </p>
                  </div>
                  <div>
                    <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{"{comarca}"}</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Comarca do processo
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{"{ano}"}</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ano de referência para filtros
                    </p>
                  </div>
                  <div>
                    <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{"{janelaTriangulacao}"}</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Período para análise de triangulação
                    </p>
                  </div>
                  <div>
                    <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{"{politicaLGPD}"}</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Diretrizes de proteção de dados
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromptStudio;