import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Palette, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

export function AppearanceTab() {
  const { settings, updateSettings } = useOrganizationSettings();
  const [primaryColor, setPrimaryColor] = useState(
    settings?.primary_color || "#2563eb",
  );
  const [secondaryColor, setSecondaryColor] = useState(
    settings?.secondary_color || "#1e40af",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateSettings.mutateAsync({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDirty =
    primaryColor !== settings?.primary_color ||
    secondaryColor !== settings?.secondary_color;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Cores do Sistema</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Personalize as cores principais da interface do sistema
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Cor Primária</Label>
            <div className="flex gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                  >
                    <div
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="font-mono text-sm">{primaryColor}</span>
                    <Paintbrush className="ml-auto h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={primaryColor}
                    onChange={setPrimaryColor}
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="mt-2 font-mono"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-xs text-muted-foreground">
              Cor principal usada em botões, links e destaques
            </p>
          </div>

          <div className="space-y-3">
            <Label>Cor Secundária</Label>
            <div className="flex gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                  >
                    <div
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <span className="font-mono text-sm">{secondaryColor}</span>
                    <Paintbrush className="ml-auto h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={secondaryColor}
                    onChange={setSecondaryColor}
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="mt-2 font-mono"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-xs text-muted-foreground">
              Cor secundária usada em elementos de apoio
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-3">Pré-visualização</p>
          <div className="flex gap-2">
            <Button style={{ backgroundColor: primaryColor }}>Primário</Button>
            <Button
              variant="secondary"
              style={{ backgroundColor: secondaryColor }}
            >
              Secundário
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setPrimaryColor(settings?.primary_color || "#2563eb");
            setSecondaryColor(settings?.secondary_color || "#1e40af");
          }}
          disabled={!isDirty}
        >
          Resetar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSubmitting}
          isLoading={isSubmitting}
        >
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
