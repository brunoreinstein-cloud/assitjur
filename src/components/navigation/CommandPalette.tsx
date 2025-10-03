import React from "react";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { NAV_GROUPS } from "@/config/sidebar";
import { usePermissions } from "@/hooks/usePermissions";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { canAccess } = usePermissions();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
              className="h-8 w-8 p-0 hover:bg-sidebar-accent"
              aria-label="Abrir pesquisa (Cmd+K)"
            >
              <Command className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Pesquisar (⌘K)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Pesquisar páginas..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          {NAV_GROUPS.map((group) => {
            const accessibleItems = group.items.filter(canAccess);

            if (accessibleItems.length === 0) return null;

            return (
              <CommandGroup key={group.title} heading={group.title}>
                {accessibleItems.map((item) => (
                  <CommandItem
                    key={item.to}
                    onSelect={() => handleSelect(item.to)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                    {item.badge && (
                      <div className="ml-auto">
                        <div className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </div>
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
