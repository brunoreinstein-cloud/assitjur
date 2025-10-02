import React, { useState } from 'react';
import { HelpCircle, FileText, Video, MessageCircle, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpLink {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  isNew?: boolean;
}

const helpLinks: HelpLink[] = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Documentação',
    description: 'Guias completos e referências',
    href: '/docs',
  },
  {
    icon: <Video className="h-5 w-5" />,
    title: 'Vídeos Tutoriais',
    description: 'Aprenda através de vídeos',
    href: '/tutorials',
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: 'Suporte',
    description: 'Entre em contato conosco',
    href: '/support',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Novidades',
    description: 'Veja as últimas atualizações',
    href: '/changelog',
    isNew: true,
  },
];

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="default"
                  className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  aria-label="Ajuda"
                >
                  <HelpCircle className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="w-80 p-0 overflow-hidden animate-scale-in"
              >
                <div className="bg-gradient-primary p-4 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Central de Ajuda</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-primary-foreground/90 mt-1">
                    Como podemos ajudá-lo hoje?
                  </p>
                </div>
                
                <div className="p-2">
                  {helpLinks.map((link, index) => (
                    <motion.a
                      key={link.title}
                      href={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="mt-0.5 text-primary group-hover:text-primary-light transition-colors">
                        {link.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                            {link.title}
                          </h4>
                          {link.isNew && (
                            <Badge variant="default" className="text-xs px-1.5 py-0">
                              Novo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {link.description}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>

                <div className="border-t p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground text-center">
                    Pressione <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-background border rounded">?</kbd> para abrir esta janela
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for keyboard shortcut
export function useHelpShortcut() {
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // Don't trigger if user is typing in an input
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
