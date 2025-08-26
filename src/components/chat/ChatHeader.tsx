import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  TrendingUp, 
  FileCheck, 
  PenTool, 
  DollarSign,
  Thermometer,
  Cpu,
  Eye,
  EyeOff
} from 'lucide-react';
import { useChatStore } from '@/stores/useChatStore';
import { Switch } from '@/components/ui/switch';

const agentConfig = {
  cnj: { 
    icon: FileText, 
    label: 'Análise CNJ', 
    description: 'Especialista em análise de processos CNJ',
    color: 'bg-blue-500',
    initials: 'CNJ'
  },
  risco: { 
    icon: TrendingUp, 
    label: 'Padrões de Risco', 
    description: 'Detecção de triangulações e fraudes',
    color: 'bg-red-500',
    initials: 'RSK'
  },
  resumo: { 
    icon: FileCheck, 
    label: 'Resumo Processual', 
    description: 'Sínteses e relatórios processuais',
    color: 'bg-green-500',
    initials: 'RES'
  },
  peca: { 
    icon: PenTool, 
    label: 'Minuta de Peça', 
    description: 'Redação de peças processuais',
    color: 'bg-purple-500',
    initials: 'PÇA'
  }
};

const models = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Rápido e econômico' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Mais inteligente' },
  { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano', description: 'Mais rápido' },
  { value: 'gpt-5-2025-08-07', label: 'GPT-5', description: 'Mais avançado' }
];

export function ChatHeader() {
  const { 
    agentId, 
    setAgent,
    model, 
    setModel, 
    temperature, 
    setTemperature,
    costUsd,
    tokensIn,
    tokensOut,
    maskPII,
    setMaskPII
  } = useChatStore();

  const currentAgent = agentConfig[agentId as keyof typeof agentConfig];
  const Icon = currentAgent?.icon || FileText;

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        {/* Agent Info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className={`${currentAgent?.color} text-white text-xs font-bold`}>
              {currentAgent?.initials}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <Select value={agentId} onValueChange={setAgent}>
                <SelectTrigger className="w-auto border-none p-0 h-auto font-semibold text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(agentConfig).map(([key, config]) => {
                    const AgentIcon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <AgentIcon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {config.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentAgent?.description}
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="flex items-center gap-4">
          {/* Token Counter */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                ${costUsd.toFixed(4)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{tokensIn.toLocaleString()} in</span>
              <span>•</span>
              <span>{tokensOut.toLocaleString()} out</span>
            </div>
          </div>

          {/* Model Selection */}
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-32">
              <Cpu className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <div>
                    <div className="font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Temperature */}
          <div className="hidden lg:flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-muted-foreground" />
            <Select value={temperature.toString()} onValueChange={(v) => setTemperature(parseFloat(v))}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.1">0.1</SelectItem>
                <SelectItem value="0.3">0.3</SelectItem>
                <SelectItem value="0.5">0.5</SelectItem>
                <SelectItem value="0.7">0.7</SelectItem>
                <SelectItem value="0.9">0.9</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PII Mask Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={maskPII}
                onCheckedChange={setMaskPII}
                className="data-[state=checked]:bg-primary"
              />
              {maskPII ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground hidden xl:inline">
              {maskPII ? 'PII Mascarado' : 'PII Visível'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}