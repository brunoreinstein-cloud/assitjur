import { BRAND } from "@/branding/brand";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface BrandHeaderProps {
  size?: "sm" | "md" | "lg";
  showVersion?: boolean;
  version?: string;
  className?: string;
}

export function BrandHeader({
  size = "md",
  showVersion = false,
  version,
  className = "",
}: BrandHeaderProps) {
  const sizeClasses = {
    sm: {
      container: "flex items-center gap-2",
      logo: "h-6 w-6",
      title: "text-lg font-semibold",
      version: "text-xs",
    },
    md: {
      container: "flex items-center gap-3",
      logo: "h-8 w-8",
      title: "text-xl font-bold",
      version: "text-sm",
    },
    lg: {
      container: "flex items-center gap-4",
      logo: "h-10 w-10",
      title: "text-2xl font-bold",
      version: "text-base",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`${classes.container} ${className}`}>
      <BrandLogo size={size} className={classes.logo} />
      <div>
        <h1 className={`${classes.title} text-brand-ink`}>{BRAND.name}</h1>
        {showVersion && version && (
          <span
            className={`${classes.version} text-muted-foreground font-mono`}
          >
            v{version}
          </span>
        )}
      </div>
    </div>
  );
}
