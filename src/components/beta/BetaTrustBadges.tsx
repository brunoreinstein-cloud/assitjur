import React from 'react';
import { Shield, Lock } from 'lucide-react';

export function BetaTrustBadges() {
  return (
    <div className="flex items-center justify-center gap-6 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3 text-primary" aria-hidden="true" focusable="false" />
        <span className="font-medium">LGPD Compliant</span>
      </div>
      <div className="w-px h-4 bg-border"></div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3 w-3 text-primary" aria-hidden="true" focusable="false" />
        <span className="font-medium">Dados seguros</span>
      </div>
    </div>
  );
}