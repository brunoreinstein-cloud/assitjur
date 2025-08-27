import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MessageSkeleton() {
  return (
    <div className="flex gap-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1 max-w-4xl">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <MessageSkeleton />
      <MessageSkeleton />
    </div>
  );
}