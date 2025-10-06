import { ProcessosDataTable } from "@/components/assistjur/ProcessosDataTable";
import { BulkDeleteManager } from "@/components/admin/BulkDeleteManager";
import { RestoreButton } from "@/components/admin/RestoreButton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProcessosTable() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Processos - AssistJur.IA</CardTitle>
              <p className="text-muted-foreground text-sm">
                Visualizar e gerenciar processos do pipeline AssistJur.IA
              </p>
            </div>
            <div className="flex gap-2">
              <RestoreButton />
              <BulkDeleteManager type="processos" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <ProcessosDataTable />
    </div>
  );
}
