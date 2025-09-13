import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportSectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'critical' | 'warning' | 'success';
  className?: string;
}

export function ReportSection({ 
  icon: Icon, 
  title, 
  children, 
  variant = 'default',
  className 
}: ReportSectionProps) {
  const variantStyles = {
    default: {
      header: 'border-b',
      icon: 'text-primary',
      title: 'text-foreground'
    },
    critical: {
      header: 'border-b border-destructive/20 bg-destructive/5',
      icon: 'text-destructive',
      title: 'text-destructive'
    },
    warning: {
      header: 'border-b border-amber-200 bg-amber-50 dark:bg-amber-950',
      icon: 'text-amber-600',
      title: 'text-amber-800 dark:text-amber-200'
    },
    success: {
      header: 'border-b border-emerald-200 bg-emerald-50 dark:bg-emerald-950',
      icon: 'text-emerald-600',
      title: 'text-emerald-800 dark:text-emerald-200'
    }
  };

  const styles = variantStyles[variant];

  return (
    <Card className={cn("print:shadow-none", className)}>
      <CardHeader className={cn("pb-4", styles.header)}>
        <CardTitle className={cn("flex items-center gap-2", styles.title)}>
          <Icon className={cn("h-5 w-5", styles.icon)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}