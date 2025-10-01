import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useMapaTestemunhasStore } from '@/lib/store/mapa-testemunhas';
import { Bot, Loader2 } from 'lucide-react';

export function LoadingHints() {
  const { loadingHints, currentHintIndex, nextHint } = useMapaTestemunhasStore();

  // Store interval reference to allow proper cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rotate hints every 800ms
  useEffect(() => {
    // Clear any existing interval before setting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      nextHint();
    }, 800);

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nextHint]);

  return (
    <div className="flex gap-4 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary animate-pulse" />
      </div>

      {/* Loading Content */}
      <div className="flex-1 max-w-4xl">
        <Card className="bg-card border-primary/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span 
                key={currentHintIndex}
                className="text-sm text-foreground font-medium transition-opacity duration-200"
              >
                {loadingHints[currentHintIndex]}
              </span>
            </div>
            
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 w-8 rounded-full bg-primary/20 animate-pulse"
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