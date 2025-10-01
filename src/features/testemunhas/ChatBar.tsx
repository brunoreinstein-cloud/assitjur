import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Scale,
  Users,
  User,
  Zap,
  Loader2,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  FileText,
  MapPin,
  Copy,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { useMapaTestemunhasStore, QueryKind } from '@/lib/store/mapa-testemunhas';
import { useAssistente } from '@/features/testemunhas/chat-engine/useAssistente';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SearchEntityType } from '@/types/search';
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_COLORS } from '@/types/search';

const QUERY_CHIPS = [
  { kind: 'processo' as const, label: 'Por Processo', icon: Scale },
  { kind: 'testemunha' as const, label: 'Por Testemunha', icon: Users },
  { kind: 'reclamante' as const, label: 'Por Reclamante', icon: User },
];

const ENTITY_ICONS: Record<SearchEntityType, any> = {
  process: FileText,
  witness: Users,
  claimant: User,
  lawyer: User,
  comarca: MapPin,
};

const SEARCH_PLACEHOLDERS: Record<QueryKind, string> = {
  processo: 'Busque por CNJ, comarca, reclamante... Ex.: 0001234-56.2024.5.02.0001, uf:RS',
  testemunha: 'Busque por nome de testemunha... Ex.: Fabiano Celestino, w:joão santos',
  reclamante: 'Busque por reclamante... Ex.: r:maria silva, uf:RS risco:alto',
};

export function ChatBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCNJDetected, setIsCNJDetected] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<'all' | 'process' | 'witness' | 'claimant'>('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    chatKind,
    chatInput,
    chatStatus,
    agentOnline,
    setChatKind,
    setChatInput,
    isPiiMasked,
  } = useMapaTestemunhasStore();

  const { runAnalysis } = useAssistente();

  // Busca unificada
  const { data: searchResults, isLoading: isSearchLoading } = useUnifiedSearch(
    chatInput,
    selectedScope,
    isSearchOpen && chatInput.length >= 2
  );

  // Auto-detect CNJ pattern and set to processo mode
  useEffect(() => {
    const cnjPattern = /\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}/;
    const hasCNJ = cnjPattern.test(chatInput);
    setIsCNJDetected(hasCNJ);

    if (hasCNJ && chatKind !== 'processo') {
      setChatKind('processo');
      setSelectedScope('process');
    }
  }, [chatInput, chatKind, setChatKind]);

  // Abrir sugestões quando há input
  useEffect(() => {
    if (chatInput.length >= 2) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  }, [chatInput]);

  // Focus input on Ctrl+K or '/' key press and clear on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && e.ctrlKey) || (e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey)) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
          setIsSearchOpen(true);
        }
      } else if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement === inputRef.current) {
          setChatInput('');
          setIsSearchOpen(false);
          inputRef.current?.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setChatInput]);

  const handleSelectResult = (result: any) => {
    setIsSearchOpen(false);
    setChatInput('');

    switch (result.type) {
      case 'process':
        navigate(`/dados/mapa?tab=por-processo&cnj=${encodeURIComponent(result.title)}`);
        break;
      case 'witness':
        navigate(`/dados/mapa?tab=por-testemunha&nome=${encodeURIComponent(result.title)}`);
        break;
      case 'claimant':
        navigate(`/dados/mapa?tab=por-processo&reclamante=${encodeURIComponent(result.title)}`);
        break;
    }
  };

  const handleCopyCNJ = (cnj: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cnj);
    toast({ title: 'CNJ copiado', description: cnj });
  };

  const handleSubmit = async () => {
    setIsSearchOpen(false);
    await runAnalysis(chatInput.trim(), chatKind);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isLoading = chatStatus === 'loading';
  const hasResults = searchResults && searchResults.results.length > 0;
  const isAmbiguous = searchResults?.isAmbiguous || false;
  const shouldBlockExecution = isAmbiguous && chatInput.length >= 2;

  return (
    <div className="space-y-4">
      {/* LGPD Notice */}
      {!isPiiMasked && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Conteúdo assistivo.</strong> Revisão humana obrigatória. 
            Dados tratados conforme LGPD. 
            <a href="/privacy" className="underline ml-2">Política de Privacidade</a>
          </AlertDescription>
        </Alert>
      )}

      {/* Ambiguity Banner */}
      {isAmbiguous && searchResults?.suggestions && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <div className="flex items-center justify-between gap-2">
              <div>
                <strong>Múltiplos resultados encontrados.</strong>{' '}
                {searchResults.suggestions.message}
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {searchResults.total} opções
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Query Type Chips */}
      <div className="flex flex-wrap gap-2">
        {QUERY_CHIPS.map(({ kind, label, icon: Icon }) => (
          <Button
            key={kind}
            variant={chatKind === kind ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setChatKind(kind);
              // Sincronizar scope de busca com tipo de query
              setSelectedScope(
                kind === 'processo' ? 'process' : kind === 'testemunha' ? 'witness' : 'claimant'
              );
            }}
            className="h-8"
            disabled={isLoading}
          >
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Button>
        ))}

        {/* Chips de escopo (aparecem com resultados) */}
        {hasResults && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            {[
              { value: 'all' as const, label: 'Todos' },
              { value: 'process' as const, label: 'Processos' },
              { value: 'witness' as const, label: 'Testemunhas' },
              { value: 'claimant' as const, label: 'Reclamantes' },
            ].map((chip) => (
              <Button
                key={chip.value}
                variant={selectedScope === chip.value ? 'default' : 'ghost'}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => setSelectedScope(chip.value)}
              >
                {chip.label}
              </Button>
            ))}
          </>
        )}

        {/* Agent Status */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1">
            {agentOnline ? (
              <CheckCircle className="h-3 w-3 text-status-success" />
            ) : (
              <AlertOctagon className="h-3 w-3 text-status-warning" />
            )}
            <span className="text-xs text-muted-foreground">{agentOnline ? 'Online' : 'Manutenção'}</span>
          </div>
        </div>
      </div>

      {/* Input Area com Autosuggest */}
      <div className="relative">
        <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                ref={inputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => chatInput.length >= 2 && setIsSearchOpen(true)}
                placeholder={SEARCH_PLACEHOLDERS[chatKind]}
                className="h-12 pr-32"
                disabled={isLoading}
              />

              {/* CNJ Detection Badge */}
              {isCNJDetected && (
                <Badge variant="secondary" className="absolute top-2 right-24 text-xs">
                  CNJ detectado
                </Badge>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!chatInput.trim() || isLoading || !agentOnline || shouldBlockExecution}
                className="absolute top-1 right-1 h-10 gap-1"
                size="sm"
                title={shouldBlockExecution ? 'Selecione uma opção específica antes de executar' : ''}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analisando...
                  </>
                ) : shouldBlockExecution ? (
                  <>
                    <Filter className="h-3 w-3" />
                    Refinar busca
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3" />
                    Executar
                  </>
                )}
              </Button>
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList>
                {isSearchLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isSearchLoading && hasResults && (
                  <>
                    {/* Mensagem de orientação quando ambíguo */}
                    {isAmbiguous && searchResults?.suggestions && (
                      <div className="px-3 py-2 border-b bg-muted/50">
                        <p className="text-xs font-medium text-foreground">
                          {searchResults.suggestions.message}
                        </p>
                      </div>
                    )}

                    {/* Agrupar por tipo */}
                    {['process', 'witness', 'claimant'].map((type) => {
                      const items = searchResults.results.filter((r: any) => r.type === type);
                      if (items.length === 0) return null;

                      const Icon = ENTITY_ICONS[type as SearchEntityType];
                      const typeLabel = ENTITY_TYPE_LABELS[type as SearchEntityType];

                      return (
                        <CommandGroup 
                          key={type} 
                          heading={
                            <div className="flex items-center justify-between w-full pr-2">
                              <span>{typeLabel}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {items.length}
                              </Badge>
                            </div>
                          }
                        >
                          {items.map((result: any) => (
                            <CommandItem
                              key={result.id}
                              onSelect={() => handleSelectResult(result)}
                              className={cn(
                                "flex items-start gap-3 py-3 cursor-pointer transition-colors",
                                isAmbiguous && "hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              )}
                            >
                              <div className="mt-0.5">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium truncate">{result.title}</span>
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] px-1.5 py-0 ${ENTITY_TYPE_COLORS[result.type]}`}
                                  >
                                    {ENTITY_TYPE_LABELS[result.type]}
                                  </Badge>
                                </div>

                                {result.subtitle && (
                                  <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                )}

                                {/* Metadados */}
                                {result.type === 'process' && result.meta && (
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                    {result.meta.status && <span>Status: {result.meta.status}</span>}
                                    {result.meta.comarca && <span>· {result.meta.comarca}</span>}
                                    {result.meta.classificacao && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                                        {result.meta.classificacao}
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {result.type === 'witness' && result.meta && (
                                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                                    <span className="text-muted-foreground">{result.meta.depoimentos} depoimentos</span>
                                    {result.meta.ambosPoles && (
                                      <Badge variant="destructive" className="text-[9px] px-1 py-0">
                                        ⚠ Ambos polos
                                      </Badge>
                                    )}
                                    {result.meta.classificacao && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                                        {result.meta.classificacao}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Ações rápidas */}
                              <div className="flex items-center gap-1">
                                {result.type === 'process' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-muted"
                                    onClick={(e) => handleCopyCNJ(result.title, e)}
                                    title="Copiar CNJ"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 hover:bg-muted"
                                  title="Abrir detalhes"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      );
                    })}
                  </>
                )}

                {!isSearchLoading && !hasResults && chatInput.length >= 2 && (
                  <CommandEmpty>
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Tente operadores: <code className="bg-muted px-1 rounded">p:</code>{' '}
                        <code className="bg-muted px-1 rounded">w:</code>{' '}
                        <code className="bg-muted px-1 rounded">uf:RS</code>
                      </p>
                    </div>
                  </CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">K</kbd>
          <span>ou</span>
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">/</kbd>
          <span>foco</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Enter</kbd>
          <span>executar análise IA</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Esc</kbd>
          <span>limpar</span>
        </span>
      </div>
    </div>
  );
}