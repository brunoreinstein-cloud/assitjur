import React, { memo } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface BooleanIconProps {
  value: boolean | null;
}

export const BooleanIcon = memo(({ value }: BooleanIconProps) => {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return value ? (
    <CheckCircle className="h-4 w-4 text-success" />
  ) : (
    <XCircle className="h-4 w-4 text-muted-foreground" />
  );
});

BooleanIcon.displayName = "BooleanIcon";

export default BooleanIcon;
