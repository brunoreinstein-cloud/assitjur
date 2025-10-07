import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SearchFilters } from "@/components/data-explorer/SearchFilters";
import { BulkActions } from "@/components/data-explorer/BulkActions";
import { QualityChips } from "@/components/data-explorer/QualityChips";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PorTestemunha } from "@/types/mapa-testemunhas";
import { ArrayField } from "@/components/mapa-testemunhas/ArrayField";
import { applyPIIMask } from "@/utils/pii-mask";
import { BulkDeleteManager } from "@/components/admin/BulkDeleteManager";
import { Card } from "@/components/ui/card";

// Using PorTestemunha from mapa-testemunhas types

export default function TestemunhasTable() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [isPiiMasked, setIsPiiMasked] = useState(false);

  // Query testemunhas usando a mesma edge function do Mapa de Testemunhas
  const {
    data: testemunhasResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "admin-testemunhas",
      profile?.organization_id,
      searchTerm,
      page,
      limit,
    ],
    queryFn: async () => {
      if (!profile?.organization_id)
        throw new Error("Organização não encontrada");

      const { data: sessionData } = await supabase.auth.getSession();
      const access_token = sessionData?.session?.access_token;
      if (!access_token) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.functions.invoke(
        "mapa-testemunhas-testemunhas",
        {
          body: {
            paginacao: { page, limit },
            filtros: { search: searchTerm.trim() || undefined },
          },
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
    staleTime: 5 * 60 * 1000,
  });

  const testemunhasData: PorTestemunha[] = testemunhasResponse?.data || [];
  const totalWitnesses = testemunhasResponse?.total_witnesses || 0;
  const totalProcessos = testemunhasResponse?.total_processos || 0;

  // Ações em massa específicas para testemunhas
  const handleFillDefaultReu = async () => {
    if (selectedRows.size === 0) return;

    try {
      // TODO: Implementar RPC para preencher réu padrão em testemunhas
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Aplicar réu padrão será implementado em breve",
      });
    } catch (error) {
      toast({
        title: "Erro ao aplicar réu padrão",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Controles de seleção usando nome_testemunha como ID
  const toggleRowSelection = (nomeTestemunha: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(nomeTestemunha)) {
      newSelection.delete(nomeTestemunha);
    } else {
      newSelection.add(nomeTestemunha);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === testemunhasData?.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(
        new Set(testemunhasData?.map((item) => item.nome_testemunha)),
      );
    }
  };

  const hasActiveFilters = searchTerm.trim() !== "";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSeverity([]);
    setPage(1);
  };

  // Helper components
  const BooleanIcon = ({ value }: { value: boolean | null }) => {
    if (value === null) return <span className="text-muted-foreground">—</span>;
    return value ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground" />
    );
  };

  const getClassificacaoColor = (classificacao: string | null) => {
    switch (classificacao?.toLowerCase()) {
      case "crítico":
        return "destructive";
      case "atenção":
        return "secondary";
      case "observação":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getSeverityFromClassificacao = (classificacao: string | null) => {
    switch (classificacao?.toLowerCase()) {
      case "crítico":
        return "ERROR";
      case "atenção":
        return "WARNING";
      case "observação":
        return "INFO";
      default:
        return "OK";
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">
          Erro ao carregar dados: {error.message}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestão de Testemunhas</h2>
            <p className="text-muted-foreground">
              {totalWitnesses} testemunhas encontradas em {totalProcessos}{" "}
              processos da organização
            </p>
          </div>
          <div className="flex gap-2">
            <BulkDeleteManager type="testemunhas" onSuccess={() => refetch()} />
            <Button
              variant="outline"
              onClick={() => setIsPiiMasked(!isPiiMasked)}
            >
              {isPiiMasked ? "Mostrar Dados" : "Mascarar PII"}
            </Button>
          </div>
        </div>
      </Card>

      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedSeverity={selectedSeverity}
        onSeverityChange={setSelectedSeverity}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <BulkActions
        selectedCount={selectedRows.size}
        onRevalidate={() => refetch()}
        onNormalizeCNJ={() => {}} // Não aplicável a testemunhas
        onFillDefaultReu={handleFillDefaultReu}
        onMergeDuplicates={() => {}}
        onDelete={() => {}}
        onExport={() => {}}
        isLoading={isLoading}
        showTestemunhaActions={true}
      />

      <div className="border border-border/50 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    testemunhasData?.length > 0 &&
                    selectedRows.size === testemunhasData.length
                  }
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead className="font-semibold">
                Nome da Testemunha
              </TableHead>
              <TableHead className="font-semibold text-center">
                Qtd Depoimentos
              </TableHead>
              <TableHead className="font-semibold text-center">
                Ambos os Polos
              </TableHead>
              <TableHead className="font-semibold text-center">
                Já Foi Reclamante
              </TableHead>
              <TableHead className="font-semibold">
                CNJs como Testemunha
              </TableHead>
              <TableHead className="font-semibold">Classificação</TableHead>
              <TableHead className="font-semibold">Qualidade</TableHead>
              <TableHead className="font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9} className="h-16">
                    <div className="animate-pulse bg-muted rounded h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : testemunhasData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhuma testemunha encontrada
                  </p>
                  {hasActiveFilters && (
                    <Button variant="link" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              testemunhasData?.map((testemunha) => (
                <TableRow
                  key={testemunha.nome_testemunha}
                  className="hover:bg-muted/20"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(testemunha.nome_testemunha)}
                      onCheckedChange={() =>
                        toggleRowSelection(testemunha.nome_testemunha)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {String(applyPIIMask(testemunha.nome_testemunha, isPiiMasked))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {testemunha.qtd_depoimentos || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <BooleanIcon
                      value={testemunha.foi_testemunha_em_ambos_polos}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <BooleanIcon value={testemunha.ja_foi_reclamante} />
                  </TableCell>
                  <TableCell>
                    <ArrayField
                      items={testemunha.cnjs_como_testemunha ?? null}
                      maxVisible={2}
                      isPiiMasked={isPiiMasked}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getClassificacaoColor(
                        testemunha.classificacao_estrategica ?? null,
                      )}
                      className="text-xs"
                    >
                      {testemunha.classificacao_estrategica || "Normal"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <QualityChips
                      severity={getSeverityFromClassificacao(
                        testemunha.classificacao_estrategica ?? null,
                      )}
                      score={
                        testemunha.qtd_depoimentos
                          ? Math.min(100, testemunha.qtd_depoimentos * 20)
                          : 50
                      }
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {testemunhasData?.length || 0} de {totalWitnesses}{" "}
          testemunhas
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {page} de {Math.ceil(totalWitnesses / limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(totalWitnesses / limit)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
