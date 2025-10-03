import { Columns } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useMapaTestemunhasStore,
  selectActiveTab,
  selectColumnVisibility,
} from "@/lib/store/mapa-testemunhas";

export function ColumnVisibilityMenu() {
  const activeTab = useMapaTestemunhasStore(selectActiveTab);
  const visibility = useMapaTestemunhasStore(selectColumnVisibility);
  const setColumnVisibility = useMapaTestemunhasStore(
    (s) => s.setColumnVisibility,
  );

  const columns =
    activeTab === "processos"
      ? [
          { key: "cnj", label: "CNJ" },
          { key: "uf", label: "UF" },
          { key: "comarca", label: "Comarca" },
          { key: "fase", label: "Fase" },
          { key: "status", label: "Status" },
          { key: "reclamante", label: "Reclamante" },
          { key: "qtdDepos", label: "Qtd Depo Únicos" },
          { key: "testemunhas", label: "Testemunhas Ativo" },
          { key: "classificacao", label: "Classificação" },
          { key: "acoes", label: "Ações" },
        ]
      : [
          { key: "nome", label: "Nome da Testemunha" },
          { key: "qtdDepo", label: "Qtd Depoimentos" },
          { key: "ambosPolos", label: "Ambos os Polos" },
          { key: "jaReclamante", label: "Já Foi Reclamante" },
          { key: "cnjs", label: "CNJs como Testemunha" },
          { key: "classificacao", label: "Classificação Estratégica" },
          { key: "acoes", label: "Ações" },
        ];

  const currentVisibility = visibility[activeTab];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Columns className="h-4 w-4" /> Colunas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={currentVisibility[col.key]}
            onCheckedChange={(v) =>
              setColumnVisibility(activeTab, col.key, v as boolean)
            }
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
