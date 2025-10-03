import { useState, useEffect } from "react";
import { Bug } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DebugMode } from "@/lib/debug-mode";
import { useToast } from "@/hooks/use-toast";

export const DebugToggle = () => {
  const [isDebugMode, setIsDebugMode] = useState(DebugMode.isEnabled());
  const { toast } = useToast();

  useEffect(() => {
    // Sincronizar estado inicial
    setIsDebugMode(DebugMode.isEnabled());
  }, []);

  const handleToggle = () => {
    const newState = DebugMode.toggle();
    setIsDebugMode(newState);

    toast({
      title: newState ? "🐛 Debug Mode Ativado" : "Debug Mode Desativado",
      description: newState
        ? "Logs detalhados estão sendo exibidos no console"
        : "Logs de debug foram desativados",
      duration: 2000,
    });
  };

  return (
    <div className="flex items-center space-x-2 bg-muted/50 px-3 py-2 rounded-md border border-border/40">
      <Bug className="h-4 w-4 text-muted-foreground" />
      <Label htmlFor="debug-mode" className="text-sm cursor-pointer">
        Debug Mode
      </Label>
      <Switch
        id="debug-mode"
        checked={isDebugMode}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
};
