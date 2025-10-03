import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  tokens,
  type Contrast,
  type Density,
} from "@/components/ui/design-tokens";

const bannerVariants = cva("w-full rounded-md border flex items-start gap-2", {
  variants: {
    variant: {
      info: "bg-blue-50 text-blue-900 border-blue-200",
      success: "bg-green-50 text-green-900 border-green-200",
      warning: "bg-yellow-50 text-yellow-900 border-yellow-200",
      destructive: "bg-red-50 text-red-900 border-red-200",
    },
    contrast: {
      normal: "",
      high: "border-2",
    },
  },
  defaultVariants: {
    variant: "info",
    contrast: "normal",
  },
});

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  density?: Density;
  title?: string;
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      className,
      variant,
      contrast,
      density = "comfortable",
      title,
      children,
      ...props
    },
    ref,
  ) => {
    const role = variant === "destructive" ? "alert" : "status";
    return (
      <div
        ref={ref}
        role={role}
        aria-label={title}
        className={cn(
          bannerVariants({ variant, contrast }),
          tokens.spacing[density],
          tokens.states.hover,
          tokens.states.focus,
          className,
        )}
        {...props}
      >
        {title && <span className={cn(tokens.typography.title)}>{title}</span>}
        {children && (
          <span className={cn(tokens.typography.body)}>{children}</span>
        )}
      </div>
    );
  },
);

Banner.displayName = "Banner";

export { Banner };
