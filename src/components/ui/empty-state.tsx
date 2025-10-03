import * as React from "react";
import { AlertCircle, Search, ShieldOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { tokens, type Density } from "@/components/ui/design-tokens";

export type EmptyStateVariant =
  | "no-data"
  | "no-results"
  | "error"
  | "permission-denied";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  density?: Density;
  variant?: EmptyStateVariant;
}

const variantConfig = {
  "no-data": {
    icon: AlertCircle,
    iconClassName: "text-muted-foreground",
  },
  "no-results": {
    icon: Search,
    iconClassName: "text-muted-foreground",
  },
  error: {
    icon: AlertTriangle,
    iconClassName: "text-destructive",
  },
  "permission-denied": {
    icon: ShieldOff,
    iconClassName: "text-warning",
  },
};

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon,
      title,
      description,
      action,
      density = "comfortable",
      variant = "no-data",
      className,
      ...props
    },
    ref,
  ) => {
    const titleId = React.useId();
    const descriptionId = description ? `${titleId}-desc` : undefined;

    const config = variantConfig[variant];
    const DefaultIcon = config.icon;
    const displayIcon = icon || (
      <DefaultIcon className={cn("h-12 w-12", config.iconClassName)} />
    );

    return (
      <div
        ref={ref}
        role="status"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "flex flex-col items-center justify-center text-center animate-fade-in",
          tokens.spacing[density],
          className,
        )}
        {...props}
      >
        <div className="mb-4 animate-scale-in">{displayIcon}</div>
        <h2
          id={titleId}
          className={cn(tokens.typography.title, "mb-2 font-semibold")}
        >
          {title}
        </h2>
        {description && (
          <p
            id={descriptionId}
            className={cn(
              tokens.typography.body,
              "text-muted-foreground max-w-md",
            )}
          >
            {description}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  },
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
