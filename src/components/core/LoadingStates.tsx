import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Generic loading spinner
export function LoadingSpinner({
  size = "default",
  className = "",
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
}

// Full page loading
export function PageLoading({
  message = "Carregando...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-subtle">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{message}</h3>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for chat messages
export function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`flex gap-4 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
        >
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <div
              className={`p-4 rounded-lg ${i % 2 === 0 ? "bg-card" : "bg-primary/10"}`}
            >
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for conversation list
export function ConversationListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex justify-between items-center mt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton for data cards
export function DataCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex gap-1 mt-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

// Table loading skeleton
export function TableSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex gap-4">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="h-6 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {[...Array(cols)].map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Inline loading for buttons
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonLoadingProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading: boolean;
}

export function ButtonLoading({
  children,
  isLoading,
  ...props
}: ButtonLoadingProps) {
  return (
    <button disabled={isLoading} {...props}>
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}
