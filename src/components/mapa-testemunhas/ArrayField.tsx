import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { applyPIIMask } from "@/utils/pii-mask";

interface ArrayFieldProps {
  items: string[] | null;
  maxVisible?: number;
  isPiiMasked?: boolean;
}

export function ArrayField({ items, maxVisible = 2, isPiiMasked = false }: ArrayFieldProps) {
  const { toast } = useToast();
  
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const maskedItems = applyPIIMask(items, isPiiMasked) as string[];
  const visibleItems = maskedItems.slice(0, maxVisible);
  const hiddenCount = items.length - maxVisible;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(items.join('\n'));
      toast({
        title: "Copiado!",
        description: "Lista copiada para a área de transferência.",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a lista.",
        variant: "destructive",
      });
    }
  };

  if (items.length <= maxVisible) {
    return (
      <div className="flex flex-wrap gap-1">
        {visibleItems.map((item, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {visibleItems.map((item, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {item}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              +{hiddenCount} <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Lista completa ({items.length} itens)</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyToClipboard}
                  className="h-8 px-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                {maskedItems.map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}