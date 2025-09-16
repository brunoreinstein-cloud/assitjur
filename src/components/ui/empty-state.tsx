import * as React from "react"

import { cn } from "@/lib/utils"
import { tokens, type Density } from "@/components/ui/design-tokens"

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  density?: Density
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { icon, title, description, action, density = "comfortable", className, ...props },
    ref
  ) => {
    const titleId = React.useId()
    const descriptionId = description ? `${titleId}-desc` : undefined

    return (
      <div
        ref={ref}
        role="status"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn("text-center", tokens.spacing[density], className)}
        {...props}
      >
        {icon && <div className="mx-auto mb-2">{icon}</div>}
        <h2 id={titleId} className={tokens.typography.title}>
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className={cn(tokens.typography.body, "text-muted-foreground")}> 
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    )
  }
)

EmptyState.displayName = "EmptyState"

export { EmptyState }
