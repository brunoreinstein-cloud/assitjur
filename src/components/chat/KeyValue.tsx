import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { User, Building2, Info, StickyNote, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyValueProps {
  label: string;
  value: string;
  type?: 'reclamante' | 'reu' | 'status' | 'observacoes';
  className?: string;
}

const getIcon = (type: KeyValueProps['type']): LucideIcon => {
  switch (type) {
    case 'reclamante': return User;
    case 'reu': return Building2;
    case 'status': return Info;
    case 'observacoes': return StickyNote;
    default: return Info;
  }
};

export function KeyValue({ label, value, type, className }: KeyValueProps) {
  const Icon = getIcon(type);
  const shouldTruncate = value.length > 40;

  const content = (
    <dl className={cn("space-y-1", className)}>
      <dt className="text-sm text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </dt>
      <dd className={cn(
        "text-sm font-medium",
        shouldTruncate && "truncate"
      )}>
        {value}
      </dd>
    </dl>
  );

  if (shouldTruncate) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="cursor-help">
            {content}
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <p className="text-sm">{value}</p>
        </HoverCardContent>
      </HoverCard>
    );
  }

  return content;
}