import React from 'react';
import { Shield, Clock, Building } from 'lucide-react';
import { BRAND } from '@/branding/brand';
import { useLastUpdate } from '@/hooks/useLastUpdate';

interface LGPDFooterProps {
  organization?: string;
  showTimestamp?: boolean;
  showVersion?: boolean;
  className?: string;
}

export function LGPDFooter({ 
  organization,
  showTimestamp = true,
  showVersion = true,
  className = ''
}: LGPDFooterProps) {
  const { versionNumber, formatLocalDateTime, publishedAtUTC } = useLastUpdate();

  return (
    <div className={`border-t bg-muted/10 p-4 space-y-3 text-xs text-muted-foreground ${className}`}>
      {/* Compliance Notice */}
      <div className="flex items-start gap-2">
        <Shield className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-amber-800 dark:text-amber-300">
            {BRAND.legal.reportDisclaimer}
          </p>
          <p>
            {BRAND.legal.complianceNote}
          </p>
        </div>
      </div>

      {/* System Information */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-muted/20">
        {organization && (
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3" />
            <span>{organization}</span>
          </div>
        )}
        
        {showTimestamp && publishedAtUTC && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              Gerado em: {formatLocalDateTime(publishedAtUTC)}
            </span>
          </div>
        )}
        
        {showVersion && versionNumber && (
          <div className="font-mono font-medium">
            v{versionNumber}
          </div>
        )}
      </div>

      {/* System Attribution */}
      <div className="text-center pt-2 border-t border-muted/20">
        <p>
          Sistema: <span className="font-medium">{BRAND.fullName}</span> • 
          Suporte: <a 
            href={`mailto:${BRAND.contact.support}`}
            className="text-primary hover:underline"
          >
            {BRAND.contact.support}
          </a>
        </p>
      </div>
    </div>
  );
}