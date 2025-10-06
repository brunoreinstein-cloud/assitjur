import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;
  
  /**
   * Card title
   */
  title: string;
  
  /**
   * Card description/content
   */
  description: string;
  
  /**
   * Icon background color using semantic tokens
   * - primary: bg-primary/20 text-primary
   * - accent: bg-accent/20 text-accent
   * - success: bg-success/20 text-success
   * - destructive: bg-destructive/20 text-destructive
   * - muted: bg-muted text-muted-foreground
   */
  iconVariant?: "primary" | "accent" | "success" | "destructive" | "muted";
  
  /**
   * Card size
   * - sm: compact card
   * - md: default size
   * - lg: larger card
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Optional badge content
   */
  badge?: React.ReactNode;
  
  /**
   * Optional footer content
   */
  footer?: React.ReactNode;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      className,
      icon: Icon,
      title,
      description,
      iconVariant = "primary",
      size = "md",
      badge,
      footer,
      ...props
    },
    ref
  ) => {
    const iconVariants = {
      primary: "bg-primary/20 text-primary",
      accent: "bg-accent/20 text-accent",
      success: "bg-success/20 text-success",
      destructive: "bg-destructive/20 text-destructive",
      muted: "bg-muted text-muted-foreground",
    };

    const sizes = {
      sm: {
        icon: "w-10 h-10",
        iconSize: "h-5 w-5",
        title: "text-base",
        description: "text-xs",
        padding: "p-4",
      },
      md: {
        icon: "w-12 h-12",
        iconSize: "h-6 w-6",
        title: "text-lg",
        description: "text-sm",
        padding: "p-6",
      },
      lg: {
        icon: "w-16 h-16",
        iconSize: "h-8 w-8",
        title: "text-xl",
        description: "text-base",
        padding: "p-8",
      },
    };

    const sizeConfig = sizes[size];

    return (
      <Card
        ref={ref}
        className={cn(
          "border-border/50 hover:border-primary/50 hover:shadow-lg group transition-all duration-300",
          className
        )}
        {...props}
      >
        <CardHeader className={cn(sizeConfig.padding, "pb-4 relative")}>
          {badge && (
            <div className="absolute top-4 right-4 z-10">
              {badge}
            </div>
          )}
          
          <div className="flex items-start gap-4">
            <div
              className={cn(
                sizeConfig.icon,
                "rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform",
                iconVariants[iconVariant]
              )}
            >
              <Icon className={sizeConfig.iconSize} />
            </div>
            
            <CardTitle className={cn(sizeConfig.title, "leading-tight")}>
              {title}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className={cn(sizeConfig.padding, "pt-0 space-y-4")}>
          <p className={cn(sizeConfig.description, "text-muted-foreground leading-relaxed")}>
            {description}
          </p>
          
          {footer && (
            <div className="pt-2 border-t border-border/50">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
FeatureCard.displayName = "FeatureCard";

export { FeatureCard };
