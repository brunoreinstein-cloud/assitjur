import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
  description: string;
  disabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Allow some shortcuts even in inputs (like Cmd/Ctrl+Enter)
        const allowInInputs = ['Enter'];
        if (!allowInInputs.includes(event.key)) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatches = !!shortcut.shift === event.shiftKey;
        const altMatches = !!shortcut.alt === event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common shortcuts for the app
export const commonShortcuts = {
  newChat: {
    key: 'n',
    ctrl: true,
    description: 'Nova conversa',
    callback: () => {
      logger.info('Nova conversa solicitada via shortcut');
    }
  },
  
  search: {
    key: 'k',
    ctrl: true,
    description: 'Busca global',
    callback: () => {
      logger.info('Busca global solicitada via shortcut');
    }
  },
  
  send: {
    key: 'Enter',
    ctrl: true,
    description: 'Enviar mensagem',
    callback: () => {
      logger.info('Envio de mensagem via shortcut');
    }
  },
  
  promptImprover: {
    key: 'i',
    ctrl: true,
    shift: true,
    description: 'Melhorar prompt',
    callback: () => {
      logger.info('Melhoria de prompt solicitada via shortcut');
    }
  },
  
  toggleSidebar: {
    key: '\\',
    ctrl: true,
    description: 'Alternar sidebar',
    callback: () => {
      logger.info('Toggle sidebar solicitado via shortcut');
    }
  },
  
  help: {
    key: '?',
    shift: true,
    description: 'Mostrar ajuda',
    callback: () => {
      logger.info('Ajuda solicitada via shortcut');
    }
  }
};

// Hook para mostrar shortcuts disponíveis
export function useShortcutHelp() {
  const shortcuts = [
    { key: 'Cmd/Ctrl + N', description: 'Nova conversa' },
    { key: 'Cmd/Ctrl + K', description: 'Busca global' },
    { key: 'Cmd/Ctrl + Enter', description: 'Enviar mensagem' },
    { key: 'Cmd/Ctrl + Shift + I', description: 'Melhorar prompt' },
    { key: 'Cmd/Ctrl + \\', description: 'Alternar sidebar' },
    { key: 'Shift + ?', description: 'Mostrar ajuda' },
    { key: 'Esc', description: 'Fechar modais' }
  ];
  
  return shortcuts;
}