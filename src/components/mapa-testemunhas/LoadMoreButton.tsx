import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

interface LoadMoreButtonProps {
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  label: string;
}

export const LoadMoreButton = ({ 
  isLoading, 
  hasMore, 
  onLoadMore, 
  label 
}: LoadMoreButtonProps) => {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center py-6">
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        variant="outline"
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>
    </div>
  );
};