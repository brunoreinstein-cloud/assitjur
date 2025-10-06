import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToTopFABProps {
  className?: string;
}

export function BackToTopFAB({ className }: BackToTopFABProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const heading = document.getElementById("main-heading");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (heading) {
      setTimeout(() => heading.focus(), 500);
    }
  };

  if (!visible) return null;

  return (
    <Button
      size="icon"
      aria-label="Voltar ao topo"
      className={cn(
        "fixed bottom-6 right-6 rounded-full shadow-lg z-50",
        className,
      )}
      onClick={scrollToTop}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
