import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const TableSkeleton = memo(({ rows = 5 }: { rows?: number }) => (
  <div 
    className="border border-border rounded-lg" 
    role="status" 
    aria-label="Carregando tabela"
  >
    {/* Header */}
    <div className="border-b border-border bg-muted/30 p-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    
    {/* Rows */}
    <div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="p-4 border-b border-border">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>

    <span className="sr-only">Carregando dados da tabela...</span>
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

