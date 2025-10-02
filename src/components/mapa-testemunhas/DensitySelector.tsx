import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, Check } from "lucide-react";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import type { Density } from "@/components/ui/design-tokens";

export function DensitySelector() {
  const density = useMapaTestemunhasStore(s => s.density);
  const setDensity = useMapaTestemunhasStore(s => s.setDensity);

  const densityOptions: { value: Density; label: string; description: string }[] = [
    { value: "compact", label: "Compacto", description: "Espaçamento mínimo" },
    { value: "comfortable", label: "Confortável", description: "Espaçamento amplo" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Densidade
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {densityOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setDensity(option.value)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
            {density === option.value && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
