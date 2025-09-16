import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle, XCircle } from "lucide-react";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import { ArrayField } from "@/components/mapa-testemunhas/ArrayField";
import { applyPIIMask } from "@/utils/pii-mask";
import { useToast } from "@/hooks/use-toast";

export function DetailDrawer() {
  const { 
    isDetailDrawerOpen, 
    setIsDetailDrawerOpen, 
    selectedProcesso, 
    selectedTestemunha,
    isPiiMasked 
  } = useMapaTestemunhasStore();
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    const maskedText = applyPIIMask(text, isPiiMasked);
    try {
      await navigator.clipboard.writeText(maskedText);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência.`,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: `Não foi possível copiar ${label}.`,
        variant: "destructive",
      });
    }
  };

  const BooleanIcon = ({ value, label }: { value: boolean | null; label?: string }) => (
    <div className="flex items-center gap-2">
      {value === null ? (
        <span className="text-muted-foreground">—</span>
      ) : value ? (
        <>
          <CheckCircle className="h-4 w-4 text-success" />
          <span>Sim</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-muted-foreground" />
          <span>Não</span>
        </>
      )}
      {label && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(value?.toString() || 'N/A', label)}
          className="h-6 w-6 p-0"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  const DetailField = ({ label, value, copyable = false }: { 
    label: string; 
    value: string | number | null; 
    copyable?: boolean;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {copyable && value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(value.toString(), label)}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
      <p className="font-mono text-sm break-all">
        {value ? applyPIIMask(value.toString(), isPiiMasked) : '—'}
      </p>
    </div>
  );

  if (!isDetailDrawerOpen || (!selectedProcesso && !selectedTestemunha)) {
    return null;
  }

  return (
    <Drawer open={isDetailDrawerOpen} onOpenChange={setIsDetailDrawerOpen}>
      <DrawerContent className="max-w-4xl mx-auto">
        <DrawerHeader>
          <DrawerTitle>
            {selectedProcesso ? (
              `Processo ${selectedProcesso.cnj}`
            ) : (
              `Testemunha ${selectedTestemunha?.nome_testemunha}`
            )}
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="h-[80vh] px-6 pb-6">
          {selectedProcesso && (
            <div className="space-y-6">
              <div className="bg-muted/20 rounded-xl p-4">
                <Badge variant="outline" className="mb-2">
                  Conteúdo assistivo. Revisão humana obrigatória.
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailField label="CNJ" value={selectedProcesso.cnj} copyable />
                <DetailField label="Status" value={selectedProcesso.status} />
                <DetailField label="UF" value={selectedProcesso.uf} />
                <DetailField label="Comarca" value={selectedProcesso.comarca} copyable />
                <DetailField label="Fase" value={selectedProcesso.fase} />
                <DetailField label="Reclamante" value={selectedProcesso.reclamante_limpo} copyable />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Advogados Parte Ativa</h3>
                <ArrayField 
                  items={selectedProcesso.advogados_parte_ativa} 
                  maxVisible={5}
                  isPiiMasked={isPiiMasked}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Testemunhas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Polo Ativo</h4>
                    <ArrayField 
                      items={selectedProcesso.testemunhas_ativo_limpo} 
                      maxVisible={5}
                      isPiiMasked={isPiiMasked}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Polo Passivo</h4>
                    <ArrayField 
                      items={selectedProcesso.testemunhas_passivo_limpo} 
                      maxVisible={5}
                      isPiiMasked={isPiiMasked}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Reclamante foi Testemunha</label>
                  <BooleanIcon value={selectedProcesso.reclamante_foi_testemunha} />
                </div>
                <DetailField 
                  label="Qtd Vezes Reclamante foi Testemunha" 
                  value={selectedProcesso.qtd_vezes_reclamante_foi_testemunha} 
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Troca Direta</label>
                  <BooleanIcon value={selectedProcesso.troca_direta} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Triangulação Confirmada</label>
                  <BooleanIcon value={selectedProcesso.triangulacao_confirmada} />
                </div>
              </div>

              <Separator />

              <DetailField 
                label="Classificação Final" 
                value={selectedProcesso.classificacao_final} 
              />
              
              <DetailField 
                label="Insight Estratégico" 
                value={selectedProcesso.insight_estrategico} 
                copyable 
              />
            </div>
          )}

          {selectedTestemunha && (
            <div className="space-y-6">
              <div className="bg-muted/20 rounded-xl p-4">
                <Badge variant="outline" className="mb-2">
                  Conteúdo assistivo. Revisão humana obrigatória.
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailField 
                  label="Nome da Testemunha" 
                  value={selectedTestemunha.nome_testemunha} 
                  copyable 
                />
                <DetailField 
                  label="Quantidade de Depoimentos" 
                  value={selectedTestemunha.qtd_depoimentos} 
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Já Foi Reclamante</label>
                  <BooleanIcon value={selectedTestemunha.ja_foi_reclamante} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Foi Testemunha em Ambos os Polos</label>
                  <BooleanIcon value={selectedTestemunha.foi_testemunha_em_ambos_polos} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Participou Troca Favor</label>
                  <BooleanIcon value={selectedTestemunha.participou_troca_favor} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Participou Triangulação</label>
                  <BooleanIcon value={selectedTestemunha.participou_triangulacao} />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">CNJs como Testemunha</h3>
                <ArrayField 
                  items={selectedTestemunha.cnjs_como_testemunha} 
                  maxVisible={5}
                  isPiiMasked={isPiiMasked}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">CNJs como Reclamante</h3>
                <ArrayField 
                  items={selectedTestemunha.cnjs_como_reclamante} 
                  maxVisible={5}
                  isPiiMasked={isPiiMasked}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailField 
                  label="Classificação" 
                  value={selectedTestemunha.classificacao} 
                />
                <DetailField 
                  label="Classificação Estratégica" 
                  value={selectedTestemunha.classificacao_estrategica} 
                />
              </div>
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}