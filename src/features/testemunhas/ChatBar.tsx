import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Users,
  User,
  Loader2,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  FileText,
  MapPin,
  Copy,
  ExternalLink,
  Search,
  X,
  Info,
  Sparkles,
  AlertCircle,
  Keyboard,
} from 'lucide-react';
import { useMapaTestemunhasStore } from '@/lib/store/mapa-testemunhas';
import { useAssistente } from '@/features/testemunhas/chat-engine/useAssistente';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SearchEntityType } from '@/types/search';
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_COLORS } from '@/types/search';

const SCOPE_CHIPS = [
  { scope: 'all' as const, label: 'Tudo', icon: Search },
  { scope: 'process' as const, label: 'Processos', icon: FileText },
  { scope: 'witness' as const, label: 'Testemunhas', icon: Users },
  { scope: 'claimant' as const, label: 'Reclamantes', icon: User },
];

const ENTITY_ICONS: Record<SearchEntityType, any> = {
  process: FileText,
  witness: Users,
  claimant: User,
  lawyer: User,
  comarca: MapPin,
};

export function ChatBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedScope, setSelectedScope] = useState<'all' | 'process' | 'witness' | 'claimant'>('all');
  const [input, setInput] = useState('');
  const [lgpdDismissed, setLgpdDismissed] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    chatKind,
    chatStatus,
    agentOnline,
    selectedProcesso,
    selectedTestemunha,
    setChatInput,
    setChatKind,
    setSelectedProcesso,
    setSelectedTestemunha,
    processos,
    testemunhas,
  } = useMapaTestemunhasStore();

  const { runAnalysis } = useAssistente();

  // Busca unificada com debounce
  const debouncedQuery = input;
  const { data: searchData, isLoading: isSearching } = useUnifiedSearch(
    debouncedQuery,
    selectedScope,
    showSuggestions && debouncedQuery.length >= 2
  );

  // Placeholder rotation
  const placeholders = [
    'Digite um nome... Ex: Fabiano Celestino',
    'Busque por CNJ... Ex: 0001234-56.2024.5.02.0001',
    'Use operadores... Ex: uf:RS comarca:POA',
    'Filtros avançados... Ex: risco:alto w:joão',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentPlaceholder = placeholders[placeholderIndex];

  // Auto-detect CNJ pattern
  useEffect(() => {
    const cnjPattern = /\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}/;
    if (cnjPattern.test(input)) {
      setSelectedScope('process');
      setChatKind('processo');
    }
  }, [input, setChatKind]);

  // Show suggestions when typing
  useEffect(() => {
    if (input.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [input]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelectResult = (result: any) => {
    console.log('🎯 handleSelectResult iniciado', {
      resultType: result.type,
      resultTitle: result.title,
      processosCarregados: processos.length,
      testemunhasCarregadas: testemunhas.length
    });

    setShowSuggestions(false);
    
    // Selecionar o item automaticamente para análise
    switch (result.type) {
      case 'process': {
        console.log('🔍 Buscando processo:', result.title);
        console.log('📊 Processos disponíveis:', processos.map(p => ({ 
          cnj: p.cnj, 
          numero_cnj: p.numero_cnj 
        })));
        
        // Encontrar o processo nos dados
        const processo = processos.find(p => 
          p.cnj === result.title || p.numero_cnj === result.title
        );
        
        if (processo) {
          console.log('✅ Processo encontrado:', processo);
          setSelectedProcesso(processo);
          setChatInput(result.title);
          setChatKind('processo');
        } else {
          console.warn('⚠️ Processo não encontrado nos dados carregados');
          setChatInput(result.title);
          setChatKind('processo');
          toast.info('Carregando dados do processo...', { duration: 2000 });
        }
        navigate(`/mapa?tab=processos&cnj=${encodeURIComponent(result.title)}`, { replace: true });
        break;
      }
      case 'witness': {
        console.log('🔍 Buscando testemunha:', result.title);
        console.log('📊 Testemunhas disponíveis:', testemunhas.map(t => t.nome_testemunha));
        
        // Encontrar a testemunha nos dados
        const testemunha = testemunhas.find(t => 
          t.nome_testemunha?.toLowerCase() === result.title.toLowerCase()
        );
        
        if (testemunha) {
          console.log('✅ Testemunha encontrada:', testemunha);
          setSelectedTestemunha(testemunha);
          setChatInput(result.title);
          setChatKind('testemunha');
        } else {
          console.warn('⚠️ Testemunha não encontrada nos dados carregados');
          setChatInput(result.title);
          setChatKind('testemunha');
          toast.info('Carregando dados da testemunha...', { duration: 2000 });
        }
        navigate(`/mapa?tab=testemunhas&nome=${encodeURIComponent(result.title)}`, { replace: true });
        break;
      }
      case 'claimant': {
        console.log('🔍 Selecionando reclamante:', result.title);
        setChatInput(result.title);
        setChatKind('reclamante');
        navigate(`/mapa?tab=processos&reclamante=${encodeURIComponent(result.title)}`, { replace: true });
        break;
      }
    }
    
    // Manter o input com o item selecionado
    setInput(result.title);
  };

  const handleCopyCNJ = (cnj: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cnj);
    toast({ title: 'CNJ copiado', description: cnj });
  };

  const handleClearSelection = () => {
    setSelectedProcesso(null);
    setSelectedTestemunha(null);
    setChatInput('');
    setInput('');
  };

  // Determinar qual item está selecionado
  const selectedItem = selectedProcesso || selectedTestemunha;
  const selectedLabel = selectedProcesso 
    ? `Processo: ${selectedProcesso.cnj || selectedProcesso.numero_cnj}`
    : selectedTestemunha
    ? `Testemunha: ${selectedTestemunha.nome_testemunha}`
    : null;

  const handleSubmit = async () => {
    if (!input.trim() || shouldBlockExecution) return;
    setShowSuggestions(false);
    setChatInput(input);
    
    // Auto-detect query kind
    const queryKind = selectedScope === 'process' ? 'processo' : 
                      selectedScope === 'witness' ? 'testemunha' : 'reclamante';
    setChatKind(queryKind);
    
    await runAnalysis(input.trim(), queryKind);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasResults = searchData && searchData.results.length > 0;
  const isAmbiguous = searchData?.isAmbiguous || false;
  const shouldBlockExecution = isAmbiguous && input.length >= 2;
  const canExecute = input.trim().length > 0 && !shouldBlockExecution && agentOnline;

  return (
    <div className="w-full mx-auto max-w-7xl p-6 space-y-6">
      {/* LGPD Notice */}
      {!lgpdDismissed && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong className="font-semibold">Conteúdo assistivo.</strong> Revisão humana obrigatória. Dados tratados conforme LGPD.{' '}
              <a href="/privacy" className="underline hover:no-underline">
                Política de Privacidade
              </a>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLgpdDismissed(true)}
              className="shrink-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Ambiguity Banner */}
      {isAmbiguous && searchData?.suggestions && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {searchData.suggestions.message}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(searchData.suggestions.counts).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Badge de Seleção Contextual */}
      {selectedItem && selectedLabel && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <Badge variant="default" className="gap-1.5 text-xs">
            {selectedProcesso && <FileText className="h-3 w-3" />}
            {selectedTestemunha && <Users className="h-3 w-3" />}
            Contexto Selecionado
          </Badge>
          <span className="text-sm font-medium text-foreground flex-1">{selectedLabel}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="h-7 px-2 hover:bg-destructive/10 gap-1.5"
          >
            <X className="h-3 w-3" />
            <span className="text-xs">Limpar</span>
          </Button>
        </div>
      )}

      {/* Unified Search Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Busca Inteligente Unificada</h2>
              <p className="text-sm text-muted-foreground">
                Pesquise por processo, testemunha ou reclamante em um único lugar
              </p>
            </div>
          </div>

          {/* Agent Status */}
          <div className="flex items-center gap-2">
            {agentOnline ? (
              <><CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Online</span></>
            ) : (
              <><AlertOctagon className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Manutenção</span></>
            )}
          </div>
        </div>

        {/* Scope Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {SCOPE_CHIPS.map((chip) => (
            <Button
              key={chip.scope}
              variant={selectedScope === chip.scope ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedScope(chip.scope)}
              className="gap-2 transition-all hover:scale-105"
            >
              <chip.icon className="h-3.5 w-3.5" />
              {chip.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Enhanced Search Input */}
      <div className="relative">
        <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
          <PopoverTrigger asChild>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg blur-sm group-hover:blur-md transition-all opacity-0 group-hover:opacity-100" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentPlaceholder}
                  className="pl-12 pr-12 h-14 text-base border-2 focus:border-primary/50 transition-all shadow-sm hover:shadow-md"
                />
                {input && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInput('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 p-0 rounded-full hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList>
                {isSearching && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isSearching && hasResults && (
                  <>
                    {isAmbiguous && searchData?.suggestions && (
                      <div className="px-3 py-2 border-b bg-muted/50">
                        <p className="text-xs font-medium text-foreground">
                          {searchData.suggestions.message}
                        </p>
                      </div>
                    )}

                    {['process', 'witness', 'claimant'].map((type) => {
                      const items = searchData.results.filter((r: any) => r.type === type);
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

                {!isSearching && !hasResults && input.length >= 2 && (
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

      {/* Enhanced Action Bar */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex-1 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            <Keyboard className="h-3.5 w-3.5" />
            <span>
              <kbd className="px-1.5 py-0.5 text-xs rounded bg-background shadow-sm">Ctrl</kbd>
              <span className="mx-1">+</span>
              <kbd className="px-1.5 py-0.5 text-xs rounded bg-background shadow-sm">K</kbd>
            </span>
          </div>
          {input.length > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              {debouncedQuery.length >= 2 ? `${searchData?.total || 0} resultados` : 'Digite para buscar'}
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canExecute || chatStatus === 'loading'}
          size="lg"
          className={cn(
            "gap-2 min-w-[160px] shadow-md hover:shadow-lg transition-all hover:scale-105",
            selectedItem && "bg-primary/90 hover:bg-primary ring-2 ring-primary/20"
          )}
        >
          {chatStatus === 'loading' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analisando...
            </>
          ) : shouldBlockExecution ? (
            <>
              <AlertCircle className="h-5 w-5" />
              Refinar busca
            </>
          ) : selectedItem ? (
            <>
              <Sparkles className="h-5 w-5" />
              Análise Contextual
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Executar Análise
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
