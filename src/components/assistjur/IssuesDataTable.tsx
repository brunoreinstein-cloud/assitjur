import { useState, useMemo, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Filter,
} from "lucide-react";
import { ValidationIssue } from "@/types/assistjur";
import { useVirtualizer } from "@tanstack/react-virtual";

interface IssuesDataTableProps {
  issues: ValidationIssue[];
  onExportIssues?: () => void;
}

export function IssuesDataTable({
  issues,
  onExportIssues,
}: IssuesDataTableProps) {
  const [filters, setFilters] = useState({
    severity: "all",
    sheet: "all",
    rule: "all",
    search: "",
  });
  const parentRef = useRef<HTMLDivElement>(null);

  // Extrair valores únicos para filtros
  const uniqueSheets = useMemo(
    () => [...new Set(issues.map((i) => i.sheet))].sort(),
    [issues],
  );

  const uniqueRules = useMemo(
    () => [...new Set(issues.map((i) => i.rule).filter(Boolean))].sort(),
    [issues],
  );

  // Filtrar issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Filtro por severidade
      if (filters.severity !== "all" && issue.severity !== filters.severity) {
        return false;
      }

      // Filtro por aba
      if (filters.sheet !== "all" && issue.sheet !== filters.sheet) {
        return false;
      }

      // Filtro por regra
      if (filters.rule !== "all" && issue.rule !== filters.rule) {
        return false;
      }

      // Busca textual
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesMessage = issue.message
          .toLowerCase()
          .includes(searchLower);
        const matchesColumn = issue.column?.toLowerCase().includes(searchLower);
        const matchesValue = issue.original
          ?.toString()
          .toLowerCase()
          .includes(searchLower);

        if (!matchesMessage && !matchesColumn && !matchesValue) {
          return false;
        }
      }

      return true;
    });
  }, [issues, filters]);

  const rowVirtualizer = useVirtualizer({
    count: filteredIssues.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  const getSeverityIcon = (severity: ValidationIssue["severity"]) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-info" />;
    }
  };

  const getSeverityColor = (severity: ValidationIssue["severity"]) => {
    switch (severity) {
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
    }
  };

  const exportIssuesCSV = () => {
    const headers = [
      "Severidade",
      "Aba",
      "Linha",
      "Coluna",
      "Regra",
      "Mensagem",
      "Valor Original",
      "Valor Corrigido",
    ];
    const csvData = [
      headers.join(","),
      ...filteredIssues.map((issue) =>
        [
          issue.severity,
          issue.sheet,
          issue.row || "",
          issue.column || "",
          issue.rule || "",
          `"${issue.message.replace(/"/g, '""')}"`,
          `"${(issue.original || "").toString().replace(/"/g, '""')}"`,
          `"${(issue.fixed || "").toString().replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `assistjur-issues-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (onExportIssues) {
      onExportIssues();
    } else {
      exportIssuesCSV();
    }
  };

  const resetFilters = () => {
    setFilters({
      severity: "all",
      sheet: "all",
      rule: "all",
      search: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Issues Detectadas ({filteredIssues.length} de {issues.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Limpar Filtros
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Severidade</label>
            <Select
              value={filters.severity}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, severity: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Aba</label>
            <Select
              value={filters.sheet}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, sheet: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {uniqueSheets.map((sheet) => (
                  <SelectItem key={sheet} value={sheet}>
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Regra</label>
            <Select
              value={filters.rule}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, rule: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {uniqueRules.map((rule) => (
                  <SelectItem key={rule} value={rule}>
                    {rule}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Buscar</label>
            <Input
              placeholder="Buscar na mensagem, coluna ou valor..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div
          ref={parentRef}
          className="rounded-md border max-h-96 overflow-y-auto"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Severidade</TableHead>
                <TableHead className="w-24">Aba</TableHead>
                <TableHead className="w-16">Linha</TableHead>
                <TableHead className="w-32">Coluna</TableHead>
                <TableHead className="w-24">Regra</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-32">Valor Original</TableHead>
                <TableHead className="w-32">Valor Corrigido</TableHead>
              </TableRow>
            </TableHeader>
            {filteredIssues.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-6"
                  >
                    {issues.length === 0
                      ? "Nenhuma issue detectada"
                      : "Nenhuma issue corresponde aos filtros"}
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const issue = filteredIssues[virtualRow.index];
                  return (
                    <TableRow
                      key={virtualRow.key}
                      className="absolute top-0 left-0 w-full"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(issue.severity)}
                          <Badge
                            variant={getSeverityColor(issue.severity)}
                            className="text-xs"
                          >
                            {issue.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {issue.sheet}
                      </TableCell>
                      <TableCell>{issue.row || "-"}</TableCell>
                      <TableCell>{issue.column || "-"}</TableCell>
                      <TableCell>
                        {issue.rule && (
                          <Badge variant="outline" className="text-xs">
                            {issue.rule}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={issue.message}>
                          {issue.message}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {issue.original && (
                          <div
                            className="truncate bg-muted px-2 py-1 rounded text-xs"
                            title={issue.original?.toString()}
                          >
                            {issue.original?.toString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {issue.fixed && (
                          <div
                            className="truncate bg-success/10 px-2 py-1 rounded text-xs"
                            title={issue.fixed?.toString()}
                          >
                            {issue.fixed?.toString()}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            )}
          </Table>
        </div>

        {filteredIssues.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredIssues.length} de {issues.length} issues
          </div>
        )}
      </CardContent>
    </Card>
  );
}
