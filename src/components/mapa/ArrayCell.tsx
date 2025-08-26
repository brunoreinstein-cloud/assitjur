import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy, MoreHorizontal } from "lucide-react";
import { formatArrayForDisplay } from "@/lib/formatters";
import { applyPIIMask } from "@/lib/pii";
import { useMapaStore } from "@/stores/useMapaStore";
import { toast } from "sonner";

interface ArrayCellProps {
  items: string[] | null | undefined;
  maxVisible?: number;
  type?: 'cnjs' | 'names' | 'generic';
}

export const ArrayCell = ({ items, maxVisible = 3, type = 'generic' }: ArrayCellProps) => {
  const { maskPII } = useMapaStore();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const { visible, hidden, total } = formatArrayForDisplay(items, maxVisible);
  
  const processItem = (item: string) => {
    return maskPII ? applyPIIMask(item) : item;
  };

  const handleCopyAll = () => {
    const textToCopy = items.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success("Lista copiada!", {
        description: `${items.length} itens copiados para a área de transferência.`
      });
    }).catch(() => {
      toast.error("Erro ao copiar", {
        description: "Não foi possível copiar a lista."
      });
    });
    setIsOpen(false);
  };

  const getBadgeVariant = () => {
    switch (type) {
      case 'cnjs':
        return 'outline' as const;
      case 'names':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((item, index) => (
        <Badge 
          key={index} 
          variant={getBadgeVariant()}
          className="text-xs max-w-[120px] truncate"
          title={processItem(item)}
        >
          {processItem(item)}
        </Badge>
      ))}
      
      {hidden > 0 && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <MoreHorizontal className="h-3 w-3 mr-1" />
              +{hidden}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  Lista completa ({total} itens)
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAll}
                  className="h-8 px-2 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-3">
              <div className="space-y-1">
                {items.map((item, index) => (
                  <div 
                    key={index}
                    className="text-sm p-2 rounded border bg-muted/30 font-mono break-all"
                  >
                    {processItem(item)}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};