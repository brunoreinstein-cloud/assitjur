import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Pin, AlertTriangle, TrendingUp, Compass, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisAccordionProps {
  secoes: {
    identificacao?: string;
    riscosPadroes?: string;
    tendencias?: string;
    consideracoes?: string;
  };
  textoOriginal?: string;
}

const sections = [
  {
    key: 'identificacao' as const,
    title: 'Identificação',
    icon: Pin,
    value: 'identificacao'
  },
  {
    key: 'riscosPadroes' as const,
    title: 'Riscos & Padrões',
    icon: AlertTriangle,
    value: 'riscos-padroes'
  },
  {
    key: 'tendencias' as const,
    title: 'Tendências',
    icon: TrendingUp,
    value: 'tendencias'
  },
  {
    key: 'consideracoes' as const,
    title: 'Considerações Finais',
    icon: Compass,
    value: 'consideracoes'
  }
];

export function AnalysisAccordion({ secoes, textoOriginal }: AnalysisAccordionProps) {
  const [isOriginalOpen, setIsOriginalOpen] = useState(false);
  
  // Filter sections that have content
  const availableSections = sections.filter(section => secoes[section.key]);
  
  if (availableSections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Análise Detalhada</h3>
        {textoOriginal && (
          <Sheet open={isOriginalOpen} onOpenChange={setIsOriginalOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Ver texto original
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Texto Original</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{textoOriginal}</ReactMarkdown>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <Accordion type="multiple" className="w-full">
        {availableSections.map((section) => {
          const Icon = section.icon;
          return (
            <AccordionItem 
              key={section.value} 
              value={section.value}
              className="border rounded-lg px-4 mb-2 last:mb-0"
            >
              <AccordionTrigger 
                className="hover:no-underline py-3"
                aria-labelledby={`section-${section.value}`}
              >
                <div className="flex items-center gap-2 text-left">
                  <Icon className={cn(
                    "h-4 w-4",
                    section.key === 'identificacao' && "text-blue-600",
                    section.key === 'riscosPadroes' && "text-red-600", 
                    section.key === 'tendencias' && "text-green-600",
                    section.key === 'consideracoes' && "text-violet-600"
                  )} aria-hidden="true" />
                  <span id={`section-${section.value}`} className="font-medium">
                    {section.title}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <ReactMarkdown
                    components={{
                      // Remove heading styles since they're already in the accordion header
                      h1: ({ children }) => <p className="font-medium text-foreground mb-2">{children}</p>,
                      h2: ({ children }) => <p className="font-medium text-foreground mb-2">{children}</p>,
                      h3: ({ children }) => <p className="font-medium text-foreground mb-1">{children}</p>,
                      h4: ({ children }) => <p className="font-medium text-foreground mb-1">{children}</p>,
                      h5: ({ children }) => <p className="font-medium text-foreground mb-1">{children}</p>,
                      h6: ({ children }) => <p className="font-medium text-foreground mb-1">{children}</p>,
                      // Style links
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          className="text-violet-600 hover:text-violet-700 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      // Style lists
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3">{children}</ol>,
                      // Style paragraphs
                      p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>
                    }}
                  >
                    {secoes[section.key]}
                  </ReactMarkdown>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}