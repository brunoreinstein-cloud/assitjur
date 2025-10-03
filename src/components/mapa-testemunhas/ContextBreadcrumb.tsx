import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ContextBreadcrumb() {
  const navigate = useNavigate();
  const navigationHistory = useMapaTestemunhasStore((s) => s.navigationHistory);
  const popNavigation = useMapaTestemunhasStore((s) => s.popNavigation);

  const handleNavigate = (index: number) => {
    const item = navigationHistory[index];
    if (item?.path) {
      navigate(item.path);
      popNavigation(index);
    }
  };

  // Se não há histórico ou só tem o item atual, não renderizar
  if (navigationHistory.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => handleNavigate(0)}
            className="flex items-center gap-1 cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Início</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {navigationHistory.slice(1).map((item, index) => {
          const isLast = index === navigationHistory.length - 2;
          const actualIndex = index + 1;

          return (
            <div key={actualIndex} className="flex items-center">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={() => handleNavigate(actualIndex)}
                    className="cursor-pointer hover:text-foreground"
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
