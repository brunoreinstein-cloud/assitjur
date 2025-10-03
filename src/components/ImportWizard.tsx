import React, { useState } from "react";
import Papa from "papaparse";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateCNJ } from "@/lib/validation/unified-cnj";

// Schema for each CSV row
const rowSchema = z.object({
  CNJ: z.string().min(1, "CNJ é obrigatório"),
  Reclamante: z.string(),
  Reclamada: z.string(),
});

interface ErrorLog {
  line: number;
  column: string;
  message: string;
}

export function ImportWizard() {
  const [cnj, setCnj] = useState("");
  const [cnjStatus, setCnjStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [cnjMessage, setCnjMessage] = useState("");

  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [summary, setSummary] = useState<{
    included: number;
    ignored: number;
  } | null>(null);

  const maskCNJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 20);
    const parts = [
      digits.slice(0, 7),
      digits.slice(7, 9),
      digits.slice(9, 13),
      digits.slice(13, 14),
      digits.slice(14, 16),
      digits.slice(16, 20),
    ];
    let result = parts[0] || "";
    if (digits.length > 7) result += `-${parts[1]}`;
    if (digits.length > 9) result += `.${parts[2]}`;
    if (digits.length > 13) result += `.${parts[3]}`;
    if (digits.length > 14) result += `.${parts[4]}`;
    if (digits.length > 16) result += `.${parts[5]}`;
    return result;
  };

  const handleCnjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnj(maskCNJ(e.target.value));
    setCnjStatus("idle");
    setCnjMessage("");
  };

  const handleCnjImport = async () => {
    const validation = validateCNJ(cnj, "final");
    if (!validation.isValid) {
      setCnjStatus("error");
      setCnjMessage(validation.errors[0] || "CNJ inválido");
      return;
    }
    setCnj(validation.formatted);
    setCnjStatus("loading");
    setCnjMessage("");
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (validation.cleaned === "00000000000000000000") {
      setCnjStatus("success");
      setCnjMessage("Processo importado com sucesso");
    } else {
      setCnjStatus("error");
      setCnjMessage("Processo não encontrado");
    }
  };

  const handleFile = (file: File) => {
    setProgress(0);
    setErrors([]);
    setSummary(null);

    file.text().then((text) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const required = Object.keys(rowSchema.shape);
          const missing = required.filter(
            (h) => !(results.meta.fields || []).includes(h),
          );
          const log: ErrorLog[] = [];
          if (missing.length > 0) {
            missing.forEach((m) =>
              log.push({ line: 1, column: m, message: `Coluna ${m} ausente` }),
            );
            setErrors(log);
            setSummary({ included: 0, ignored: results.data.length });
            setProgress(100);
            return;
          }

          let included = 0;
          interface CsvRow {
            [key: string]: string | number | boolean;
          }

          (results.data as CsvRow[]).forEach((row, index) => {
            const parsed = rowSchema.safeParse(row);
            if (parsed.success) {
              included++;
            } else {
              parsed.error.issues.forEach((issue) => {
                log.push({
                  line: index + 2,
                  column: issue.path.join(".") || "desconhecida",
                  message: issue.message,
                });
              });
            }
          });

          setErrors(log);
          setSummary({ included, ignored: log.length });
          setProgress(100);
        },
      });
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Importar Processos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="cnj">Número CNJ</label>
          <div className="flex gap-2">
            <Input
              id="cnj"
              placeholder="0000000-00.0000.0.00.0000"
              value={cnj}
              onChange={handleCnjChange}
            />
            <Button
              onClick={handleCnjImport}
              disabled={cnjStatus === "loading"}
            >
              Importar
            </Button>
          </div>
          {cnjStatus === "loading" && <Progress value={50} />}
          {cnjStatus === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{cnjMessage}</AlertDescription>
            </Alert>
          )}
          {cnjStatus === "success" && (
            <Alert>
              <AlertDescription>{cnjMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="file">Arquivo CSV</label>
          <Input
            id="file"
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {progress > 0 && <Progress value={progress} />}
          {summary && (
            <div className="text-sm">
              <p>Itens incluídos: {summary.included}</p>
              <p>Itens ignorados: {summary.ignored}</p>
            </div>
          )}
          {errors.length > 0 && (
            <ul className="text-sm text-destructive">
              {errors.map((err, idx) => (
                <li key={idx}>
                  Linha {err.line}, coluna {err.column}: {err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ImportWizard;
