import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseList, normalizeCNJ } from "@/lib/importer/utils";

/**
 * Componente de teste para validar as correções implementadas
 */
export function TestValidation() {
  const [testInput, setTestInput] = useState(
    "['1234567-89.2023.4.05.0001','2345678-90.2023.4.05.0002']",
  );
  const [result, setResult] = useState<string[]>([]);

  const runTest = () => {
    const parsed = parseList(testInput);
    setResult(parsed);
  };

  const testCases = [
    "['CNJ1','CNJ2','CNJ3']",
    "CNJ1;CNJ2;CNJ3",
    "CNJ1,CNJ2,CNJ3",
    "[]",
    "",
    "CNJ-único",
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Teste de Validação - parseList</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Entrada de teste:</label>
          <Input
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Digite o valor para testar"
          />
          <Button onClick={runTest} size="sm">
            Testar parseList
          </Button>
        </div>

        {result.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Resultado:</h4>
            <div className="flex flex-wrap gap-2">
              {result.map((item, index) => (
                <Badge key={index} variant="secondary">
                  {item} ({normalizeCNJ(item).length} dígitos)
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Casos de teste pré-definidos:</h4>
          <div className="grid gap-2">
            {testCases.map((testCase, index) => {
              const parsed = parseList(testCase);
              return (
                <div key={index} className="p-2 border rounded text-xs">
                  <div className="font-mono text-muted-foreground mb-1">
                    Entrada: {testCase || "(vazio)"}
                  </div>
                  <div>
                    Resultado: [{parsed.join(", ")}] ({parsed.length} items)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
