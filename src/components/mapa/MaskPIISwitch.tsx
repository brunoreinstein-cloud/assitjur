import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";

export const MaskPIISwitch = () => {
  const isPiiMasked = useMapaTestemunhasStore((s) => s.isPiiMasked);
  const setIsPiiMasked = useMapaTestemunhasStore((s) => s.setIsPiiMasked);

  return (
    <div className="flex items-center space-x-3">
      <Shield className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center space-x-2">
        <Switch
          id="mask-pii"
          checked={isPiiMasked}
          onCheckedChange={setIsPiiMasked}
        />
        <Label
          htmlFor="mask-pii"
          className="text-sm font-medium cursor-pointer flex items-center gap-1"
        >
          {isPiiMasked ? (
            <>
              <EyeOff className="h-3 w-3" />
              Mascarar PII
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              Mostrar PII
            </>
          )}
        </Label>
      </div>
    </div>
  );
};
