import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useMapaStore } from "@/stores/useMapaStore";

export const MaskPIISwitch = () => {
  const { maskPII, setMaskPII } = useMapaStore();

  return (
    <div className="flex items-center space-x-3">
      <Shield className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center space-x-2">
        <Switch
          id="mask-pii"
          checked={maskPII}
          onCheckedChange={setMaskPII}
        />
        <Label 
          htmlFor="mask-pii" 
          className="text-sm font-medium cursor-pointer flex items-center gap-1"
        >
          {maskPII ? (
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