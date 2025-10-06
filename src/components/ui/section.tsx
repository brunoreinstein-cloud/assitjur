import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Background variant using semantic tokens
   * - default: bg-background
   * - muted: bg-muted/20
   * - card: bg-card
   * - gradient: gradient background
   */
  variant?: "default" | "muted" | "card" | "gradient";
  
  /**
   * Padding size using spacing tokens
   * - sm: py-12
   * - md: py-16
   * - lg: py-20
   * - xl: py-24
   */
  size?: "sm" | "md" | "lg" | "xl";
  
  /**
   * Container size
   * - default: max-w-6xl
   * - wide: max-w-7xl
   * - narrow: max-w-4xl
   * - full: w-full
   */
  container?: "default" | "wide" | "narrow" | "full";
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, variant = "default", size = "lg", container = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-background",
      muted: "bg-muted/20",
      card: "bg-card",
      gradient: "bg-gradient-to-br from-primary/10 via-background to-background",
    };

    const sizes = {
      sm: "py-12",
      md: "py-16",
      lg: "py-20",
      xl: "py-24",
    };

    const containers = {
      default: "max-w-6xl",
      wide: "max-w-7xl",
      narrow: "max-w-4xl",
      full: "w-full",
    };

    return (
      <section
        ref={ref}
        className={cn(variants[variant], sizes[size], className)}
        {...props}
      >
        <div className={cn("container mx-auto px-6", containers[container])}>
          {children}
        </div>
      </section>
    );
  }
);
Section.displayName = "Section";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alignment
   * - left: text-left
   * - center: text-center
   * - right: text-right
   */
  align?: "left" | "center" | "right";
  
  /**
   * Bottom spacing
   */
  spacing?: "sm" | "md" | "lg" | "xl";
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, align = "center", spacing = "lg", children, ...props }, ref) => {
    const alignments = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    };

    const spacings = {
      sm: "mb-8",
      md: "mb-12",
      lg: "mb-16",
      xl: "mb-20",
    };

    return (
      <div
        ref={ref}
        className={cn(alignments[align], spacings[spacing], "space-y-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";

const SectionTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-3xl md:text-4xl font-bold text-foreground",
      className
    )}
    {...props}
  />
));
SectionTitle.displayName = "SectionTitle";

const SectionDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-lg md:text-xl text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
SectionDescription.displayName = "SectionDescription";

export { Section, SectionHeader, SectionTitle, SectionDescription };
