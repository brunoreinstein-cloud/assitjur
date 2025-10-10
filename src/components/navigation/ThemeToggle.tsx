import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isClient, getLocalStorage, getDocument } from "@/lib/ssr-utils";

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    if (!isClient) return;
    
    // Check for saved theme or system preference
    const localStorage = getLocalStorage();
    const document = getDocument();
    const savedTheme = localStorage?.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemTheme;

    setTheme(initialTheme);
    if (document) {
      document.documentElement.classList.toggle("dark", initialTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    if (isClient) {
      const localStorage = getLocalStorage();
      const document = getDocument();
      
      if (localStorage) {
        localStorage.setItem("theme", newTheme);
      }
      if (document) {
        document.documentElement.classList.toggle("dark", newTheme === "dark");
      }
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0 hover:bg-sidebar-accent"
            aria-label={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Alternar tema ({theme === "light" ? "escuro" : "claro"})</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
