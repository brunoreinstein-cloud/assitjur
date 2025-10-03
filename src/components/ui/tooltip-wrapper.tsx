import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  content: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function TooltipWrapper({
  content,
  children,
  disabled,
  className,
}: TooltipWrapperProps) {
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          className={`max-w-xs border-slate-200 shadow-md ${className || ""}`}
          side="top"
        >
          <p className="text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
