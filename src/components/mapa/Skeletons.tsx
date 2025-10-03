import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const TableRowSkeleton = () => (
  <div className="border-b border-border">
    <div className="flex items-center space-x-4 p-4">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-6 w-20" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="border border-border rounded-lg">
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
        <TableRowSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const FiltersSkeleton = () => (
  <div className="flex flex-col gap-4 p-6 border border-border rounded-lg bg-card">
    <div className="flex flex-wrap items-center gap-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-28" />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-28" />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <Card className="rounded-2xl">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16" />
    </CardContent>
  </Card>
);

export const DrawerSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>

    {/* Content */}
    <div className="space-y-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
        </div>
      ))}
    </div>

    {/* Actions */}
    <div className="flex gap-2 pt-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
);

export const PresetButtonsSkeleton = () => (
  <div className="flex gap-2">
    {Array.from({ length: 3 }, (_, i) => (
      <Skeleton key={i} className="h-8 w-24" />
    ))}
  </div>
);

export const PaginationSkeleton = () => (
  <div className="flex items-center justify-between p-4">
    <Skeleton className="h-4 w-32" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
  </div>
);
