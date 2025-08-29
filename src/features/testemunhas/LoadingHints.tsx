import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useMapaTestemunhasStore } from '@/lib/store/mapa-testemunhas';
import { Bot, Loader2 } from 'lucide-react';

export function LoadingHints() {
  const { loadingHints, currentHintIndex, nextHint } = useMapaTestemunhasStore();

  // Rotate hints every 800ms
  useEffect(() => {
    const interval = setInterval(() => {
      nextHint();
    }, 800);

    return () => clearInterval(interval);
  }, [nextHint]);

  return (
    <div className="flex gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary" />
      </div>

      {/* Loading Content */}
      <div className="flex-1 max-w-4xl">
        <Card className="bg-card border-violet-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              <span className="text-sm text-violet-700 font-medium">
                {loadingHints[currentHintIndex]}
              </span>
            </div>
            
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 w-8 rounded-full bg-violet-200 animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}