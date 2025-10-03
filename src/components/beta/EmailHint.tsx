import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function EmailHint() {
  return (
    <Alert className="mt-2 border-amber-200 bg-amber-50 text-amber-800">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-sm">
        <strong>Dica:</strong> Prefira usar seu e-mail corporativo para receber
        conteúdos personalizados sobre gestão jurídica.
      </AlertDescription>
    </Alert>
  );
}
