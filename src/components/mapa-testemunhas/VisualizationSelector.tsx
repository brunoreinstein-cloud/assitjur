import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMapaTestemunhasStore,
  selectSavedViews,
  selectActiveViewName,
} from "@/lib/store/mapa-testemunhas";

interface VisualizationSelectorProps {
  userId: string;
}

export function VisualizationSelector({ userId }: VisualizationSelectorProps) {
  const savedViews = useMapaTestemunhasStore(selectSavedViews);
  const activeView = useMapaTestemunhasStore(selectActiveViewName);
  const saveView = useMapaTestemunhasStore((s) => s.saveView);
  const setActiveViewName = useMapaTestemunhasStore((s) => s.setActiveViewName);

  const handleSave = () => {
    const name = window.prompt("Nome da visualização");
    if (name) {
      saveView(name, userId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={activeView || ""}
        onValueChange={(v) => setActiveViewName(v, userId)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Visualizações" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(savedViews).map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        className="flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" /> Salvar visão
      </Button>
    </div>
  );
}
