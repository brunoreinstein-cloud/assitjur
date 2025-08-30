import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Scale,
  MapPin,
  Calendar,
  User,
  Users,
  FileText,
  AlertTriangle,
  Triangle,
  ArrowRightLeft,
  FileX,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import { ProcessoRow } from '@/types/processos-explorer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProcessoDetailDrawerProps {
  processo: ProcessoRow | null;
  open: boolean;
  onClose: () => void;
  isPiiMasked: boolean;
}

export function ProcessoDetailDrawer({
  processo,
  open,
  onClose,
  isPiiMasked
}: ProcessoDetailDrawerProps) {
  const { toast } = useToast();

  if (!processo) return null;

  const maskPII = (text?: string) => {
    if (!isPiiMasked || !text) return text;
    if (text.length <= 4) return '***';
    return text.slice(0, 2) + '***' + text.slice(-2);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatCNJ = (cnj?: string) => {
    if (!cnj) return 'N/A';
    if (cnj.length === 20) {
      return `${cnj.slice(0, 7)}-${cnj.slice(7, 9)}.${cnj.slice(9, 13)}.${cnj.slice(13, 14)}.${cnj.slice(14, 16)}.${cnj.slice(16, 20)}`;
    }
    return cnj;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência.",
      });
    });
  };

  const getClassificacaoColor = (classificacao?: string) => {
    switch (classificacao?.toLowerCase()) {
      case 'alto':
        return 'destructive';
      case 'médio':
        return 'outline';
      case 'baixo':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const totalTestemunhas = (processo.testemunhas_ativo?.length || 0) + (processo.testemunhas_passivo?.length || 0);
  const advogadoPrincipal = processo.advogados_ativo?.[0];
  const demaisAdvogados = processo.advogados_ativo?.slice(1) || [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Detalhes do Processo
              </SheetTitle>
              <SheetDescription className="mt-1">
                CNJ: {formatCNJ(processo.cnj)}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(processo.cnj)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Tabs defaultValue="geral">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="padroes">Padrões</TabsTrigger>
              <TabsTrigger value="entidades">Entidades</TabsTrigger>
              <TabsTrigger value="eventos">Eventos</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4 mt-4">
              {/* Metadados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações Processuais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CNJ</label>
                      <div className="font-mono text-sm">{formatCNJ(processo.cnj)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div>
                        {processo.status ? (
                          <Badge variant="outline">{processo.status}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fase</label>
                      <div>
                        {processo.fase ? (
                          <Badge variant="outline">{processo.fase}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Score de Risco</label>
                      <div className="font-bold text-lg">
                        {processo.score_risco || '—'}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Localização
                      </label>
                      <div className="mt-1 space-y-1">
                        <div><strong>Comarca:</strong> {processo.comarca || '—'}</div>
                        <div><strong>Tribunal:</strong> {processo.tribunal || '—'}</div>
                        <div><strong>Vara:</strong> {processo.vara || '—'}</div>
                        <div><strong>UF:</strong> {processo.uf || '—'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Audiência
                      </label>
                      <div className="mt-1">
                        {processo.data_audiencia ? (
                          formatDate(processo.data_audiencia)
                        ) : (
                          <span className="text-muted-foreground">Não informado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Classificação</label>
                    <div className="mt-1">
                      {processo.classificacao_final ? (
                        <Badge variant={getClassificacaoColor(processo.classificacao_final)} className="text-sm">
                          {processo.classificacao_final}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Não classificado</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              {processo.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{processo.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="padroes" className="space-y-4 mt-4">
              {/* Flags de Risco */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Flags de Risco Identificadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      processo.triangulacao_confirmada 
                        ? "border-purple-200 bg-purple-50" 
                        : "border-border bg-muted/50"
                    )}>
                      <div className="flex items-center gap-2">
                        <Triangle className={cn(
                          "h-4 w-4",
                          processo.triangulacao_confirmada ? "text-purple-600" : "text-muted-foreground"
                        )} />
                        <span className="font-medium">Triangulação</span>
                      </div>
                      <Badge variant={processo.triangulacao_confirmada ? "default" : "outline"}>
                        {processo.triangulacao_confirmada ? "DETECTADA" : "Não detectada"}
                      </Badge>
                    </div>

                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      processo.troca_direta 
                        ? "border-amber-200 bg-amber-50" 
                        : "border-border bg-muted/50"
                    )}>
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className={cn(
                          "h-4 w-4",
                          processo.troca_direta ? "text-amber-600" : "text-muted-foreground"
                        )} />
                        <span className="font-medium">Troca Direta</span>
                      </div>
                      <Badge variant={processo.troca_direta ? "default" : "outline"}>
                        {processo.troca_direta ? "DETECTADA" : "Não detectada"}
                      </Badge>
                    </div>

                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      processo.prova_emprestada 
                        ? "border-destructive bg-destructive/5" 
                        : "border-border bg-muted/50"
                    )}>
                      <div className="flex items-center gap-2">
                        <FileX className={cn(
                          "h-4 w-4",
                          processo.prova_emprestada ? "text-destructive" : "text-muted-foreground"
                        )} />
                        <span className="font-medium">Prova Emprestada</span>
                      </div>
                      <Badge variant={processo.prova_emprestada ? "destructive" : "outline"}>
                        {processo.prova_emprestada ? "DETECTADA" : "Não detectada"}
                      </Badge>
                    </div>

                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      processo.reclamante_foi_testemunha 
                        ? "border-sky-200 bg-sky-50" 
                        : "border-border bg-muted/50"
                    )}>
                      <div className="flex items-center gap-2">
                        <Users className={cn(
                          "h-4 w-4",
                          processo.reclamante_foi_testemunha ? "text-sky-600" : "text-muted-foreground"
                        )} />
                        <span className="font-medium">Duplo Papel (Reclamante→Testemunha)</span>
                      </div>
                      <Badge variant={processo.reclamante_foi_testemunha ? "default" : "outline"}>
                        {processo.reclamante_foi_testemunha ? "DETECTADO" : "Não detectado"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="entidades" className="space-y-4 mt-4">
              {/* Partes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Partes do Processo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reclamante</label>
                    <div className="mt-1 font-medium">
                      {maskPII(processo.reclamante_nome) || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Réu</label>
                    <div className="mt-1 font-medium">
                      {maskPII(processo.reu_nome) || '—'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advogados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Advogados ({(processo.advogados_ativo?.length || 0) + (processo.advogados_passivo?.length || 0)})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {advogadoPrincipal && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Principal (Polo Ativo)</label>
                      <div className="mt-1 font-medium flex items-center gap-2">
                        {maskPII(advogadoPrincipal)}
                        <Badge variant="outline" className="text-xs">Principal</Badge>
                      </div>
                    </div>
                  )}

                  {demaisAdvogados.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Demais Advogados (Polo Ativo)</label>
                      <div className="mt-2 space-y-1">
                        {demaisAdvogados.map((advogado, index) => (
                          <div key={index} className="text-sm">
                            {maskPII(advogado)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {processo.advogados_passivo && processo.advogados_passivo.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Polo Passivo</label>
                      <div className="mt-2 space-y-1">
                        {processo.advogados_passivo.map((advogado, index) => (
                          <div key={index} className="text-sm">
                            {maskPII(advogado)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Testemunhas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Testemunhas ({totalTestemunhas})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {processo.testemunhas_ativo && processo.testemunhas_ativo.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Polo Ativo ({processo.testemunhas_ativo.length})</label>
                      <div className="mt-2 space-y-1">
                        {processo.testemunhas_ativo.map((testemunha, index) => (
                          <div key={index} className="text-sm flex items-center justify-between">
                            <span>{maskPII(testemunha)}</span>
                            <Badge variant="outline" className="text-xs">Ativo</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {processo.testemunhas_passivo && processo.testemunhas_passivo.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Polo Passivo ({processo.testemunhas_passivo.length})</label>
                      <div className="mt-2 space-y-1">
                        {processo.testemunhas_passivo.map((testemunha, index) => (
                          <div key={index} className="text-sm flex items-center justify-between">
                            <span>{maskPII(testemunha)}</span>
                            <Badge variant="outline" className="text-xs">Passivo</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalTestemunhas === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      Nenhuma testemunha registrada
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="eventos" className="space-y-4 mt-4">
              {/* Metadados do Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico do Registro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span>{formatDate(processo.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atualizado em:</span>
                    <span>{formatDate(processo.updated_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versão:</span>
                    <span className="font-mono">{processo.version_id}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Ações Disponíveis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir na Visão "Por Processo"
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Detalhes (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Detalhes (JSON)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}