import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessoFilters } from "./ProcessoFilters";
import { TestemunhaFilters } from "./TestemunhaFilters";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterDrawer({ open, onOpenChange }: FilterDrawerProps) {
  const activeTab = useMapaTestemunhasStore((s) => s.activeTab);
  const [internalTab, setInternalTab] = useState<string>(
    activeTab === "processos" ? "processos" : "testemunhas",
  );

  useEffect(() => {
    setInternalTab(activeTab === "processos" ? "processos" : "testemunhas");
  }, [activeTab]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[600px] sm:w-[700px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>
            Refine sua busca com filtros específicos por processo ou testemunha
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={internalTab} onValueChange={setInternalTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="processos">Por Processo</TabsTrigger>
              <TabsTrigger value="testemunhas">Por Testemunha</TabsTrigger>
            </TabsList>

            <TabsContent value="processos" className="mt-4">
              <ProcessoFilters />
            </TabsContent>

            <TabsContent value="testemunhas" className="mt-4">
              <TestemunhaFilters />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
