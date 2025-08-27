import React, { useEffect } from 'react';
import { useChatStore } from '@/stores/useChatStore';

export function KeyboardShortcuts() {
  const { reset } = useChatStore();

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // ESC key for Nova Consulta
      if (e.key === 'Escape' && !['INPUT', 'TEXTAREA'].includes((e.target as Element).tagName)) {
        e.preventDefault();
        reset();
        
        // Focus input after reset
        setTimeout(() => {
          const textarea = document.querySelector('textarea[placeholder*="Digite"]') as HTMLTextAreaElement;
          if (textarea) {
            textarea.focus();
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [reset]);

  return null; // This component only handles keyboard events
}