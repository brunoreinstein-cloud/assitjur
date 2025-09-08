import { memo, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy, MoreHorizontal } from "lucide-react";
import { formatArrayForDisplay } from "@/lib/formatters";
import { applyPIIMask } from "@/lib/pii";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import { toast } from "sonner";

interface ArrayCellProps {
  items: readonly string[] | null | undefined;
  maxVisible?: number;
  type?: 'cnjs' | 'names' | 'generic';
  className?: string;
}

// ✅ Memoizado para evitar re-renders desnecessários
export const ArrayCell = memo<ArrayCellProps>(({ 
  items, 
  maxVisible = 3, 
  type = 'generic',
  className 
}) => {
  const isPiiMasked = useMapaTestemunhasStore(s => s.isPiiMasked);
  
  // ✅ Memoizar processamento dos itens
  const processedData = useMemo(() => {
    if (!items || items.length === 0) {
      return null;
    }
    
    const { visible, hidden, total } = formatArrayForDisplay([...items], maxVisible);
    
    return {
      visible: visible.map(item => isPiiMasked ? applyPIIMask(item) : item),
      hidden,
      total,
      rawItems: items
    };
  }, [items, maxVisible, isPiiMasked]);

  // ✅ Callback memoizado para copiar
  const handleCopyAll = useCallback(async () => {
    if (!processedData?.rawItems) return;
    
    try {
      await navigator.clipboard.writeText(processedData.rawItems.join('\n'));
      toast.success("Lista copiada!", {
        description: `${processedData.rawItems.length} itens copiados.`
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error("Erro ao copiar", {
        description: "Não foi possível copiar a lista."
      });
    }
  }, [processedData?.rawItems]);

  // ✅ Memoizar variant do badge
  const badgeVariant = useMemo(() => {
    switch (type) {
      case 'cnjs': return 'outline' as const;
      case 'names': return 'secondary' as const;
      default: return 'outline' as const;
    }
  }, [type]);

  if (!processedData) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {processedData.visible.map((item, index) => (
        <Badge 
          key={`${item}-${index}`} // ✅ Key mais estável
          variant={badgeVariant}
          className="text-xs max-w-[120px] truncate"
          title={item}
        >
          {item}
        </Badge>
      ))}
      
      {processedData.hidden > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              aria-label={`Ver mais ${processedData.hidden} itens`}
            >
              <MoreHorizontal className="h-3 w-3 mr-1" aria-hidden="true" />
              +{processedData.hidden}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  Lista completa ({processedData.total} itens)
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAll}
                  className="h-8 px-2 text-xs"
                  aria-label="Copiar todos os itens"
                >
                  <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
                  Copiar
                </Button>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-3">
              <div className="space-y-1" role="list">
                {processedData.rawItems.map((item, index) => (
                  <div 
                    key={`full-${item}-${index}`}
                    className="text-sm p-2 rounded border bg-muted/30 font-mono break-all"
                    role="listitem"
                  >
                    {isPiiMasked ? applyPIIMask(item) : item}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});

ArrayCell.displayName = 'ArrayCell';

