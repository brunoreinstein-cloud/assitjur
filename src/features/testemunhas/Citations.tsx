import { Badge } from "@/components/ui/badge";
import { Citation } from "@/lib/store/mapa-testemunhas";
import { FileText, User, ExternalLink } from "lucide-react";

interface CitationsProps {
  citations: Citation[];
}

export function Citations({ citations }: CitationsProps) {
  if (!citations.length) return null;

  const getIcon = (source: Citation["source"]) => {
    switch (source) {
      case "por_processo":
        return <FileText className="h-3 w-3" />;
      case "por_testemunha":
        return <User className="h-3 w-3" />;
      default:
        return <ExternalLink className="h-3 w-3" />;
    }
  };

  const getVariant = (source: Citation["source"]) => {
    switch (source) {
      case "por_processo":
        return "default";
      case "por_testemunha":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="pt-3 border-t">
      <div className="flex items-center gap-2 mb-2">
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Citações:
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {citations.map((citation, index) => (
          <Badge
            key={index}
            variant={getVariant(citation.source)}
            className="text-xs flex items-center gap-1"
          >
            {getIcon(citation.source)}
            {citation.ref}
          </Badge>
        ))}
      </div>
    </div>
  );
}
