import React, { memo } from "react";
import { BRAND } from "@/branding/brand";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  variation?: "light" | "dark" | "mark";
  className?: string;
}

const sizeClasses: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "h-6",
  md: "h-8",
  lg: "h-10",
};

export const BrandLogo = memo(function BrandLogo({
  size = "md",
  variation = "light",
  className,
}: BrandLogoProps) {
  return (
    <img
      src={BRAND.logo[variation]}
      alt={BRAND.name}
      className={cn("w-auto object-contain", sizeClasses[size], className)}
      loading="lazy"
      decoding="async"
    />
  );
});

export default BrandLogo;
