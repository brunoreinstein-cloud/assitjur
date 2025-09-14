import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

interface Witness {
  nome: string;
  vinculo: string;
  risco: 'Alto' | 'Médio' | 'Baixo';
  prova: 'Sim' | 'Não';
}

const mockData: Witness[] = [
  { nome: 'Ana Souza', vinculo: 'Ex-empregada', risco: 'Alto', prova: 'Não' },
  { nome: 'Bruno Lima', vinculo: 'Colega', risco: 'Médio', prova: 'Sim' },
  { nome: 'Carla Dias', vinculo: 'Gerente', risco: 'Baixo', prova: 'Sim' },
  { nome: 'Daniel Rocha', vinculo: 'Fornecedor', risco: 'Médio', prova: 'Não' },
  { nome: 'Elisa Moreira', vinculo: 'Consultora', risco: 'Alto', prova: 'Sim' },
];

export default function DemoMapaTestemunhas() {
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, 4));

  const resetTour = () => setStep(0);
  // Popovers são controlados pelo estado `step`

  const riskColor = (risco: Witness['risco']) =>
    risco === 'Alto' ? 'text-red-600' : risco === 'Médio' ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mapa de Testemunhas (Demo)</h1>
        <p className="text-muted-foreground mt-2">
          Demonstração interativa do sistema de mapeamento de testemunhas
        </p>
      </header>

      {/* Indicador de progresso */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {[0, 1, 2, 3, 4].map((stepIndex) => (
          <div
            key={stepIndex}
            className={`h-2 w-8 rounded-full transition-colors ${
              stepIndex === step 
                ? 'bg-primary' 
                : stepIndex < step 
                  ? 'bg-primary/60' 
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-4">
        <Popover open={step === 0}>
          <PopoverTrigger asChild>
            <Button>Novo Mapa</Button>
          </PopoverTrigger>
          <PopoverContent data-testid="tour-step-0">
            <p>Crie um novo mapa de testemunhas.</p>
            <Button size="sm" className="mt-2" onClick={next}>
              Próximo
            </Button>
          </PopoverContent>
        </Popover>

        <Popover open={step === 1}>
          <PopoverTrigger asChild>
            <Button variant="outline">Importar do CNJ (mock)</Button>
          </PopoverTrigger>
          <PopoverContent data-testid="tour-step-1">
            <p>Simule a importação de dados do CNJ.</p>
            <Button size="sm" className="mt-2" onClick={next}>
              Próximo
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <Popover open={step === 2}>
        <PopoverTrigger asChild>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Prova Emprestada</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((witness) => (
                  <TableRow key={witness.nome}>
                    <TableCell>{witness.nome}</TableCell>
                    <TableCell>{witness.vinculo}</TableCell>
                    <TableCell>
                      <span className={riskColor(witness.risco)}>{witness.risco}</span>
                    </TableCell>
                    <TableCell>{witness.prova}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </PopoverTrigger>
        <PopoverContent data-testid="tour-step-2">
          <p>Revise as testemunhas e seus vínculos.</p>
          <Button size="sm" className="mt-2" onClick={next}>
            Próximo
          </Button>
        </PopoverContent>
      </Popover>

      <Popover open={step === 3}>
        <PopoverTrigger asChild>
          <div className="h-40 border rounded flex items-center justify-center text-muted-foreground">
            Mini grafo (placeholder)
          </div>
        </PopoverTrigger>
        <PopoverContent data-testid="tour-step-3">
          <p>Visualize as relações no grafo.</p>
          <Button size="sm" className="mt-2" onClick={next}>
            Próximo
          </Button>
        </PopoverContent>
      </Popover>

      <Popover open={step === 4}>
        <PopoverTrigger asChild>
          <Button>Gerar PDF (mock)</Button>
        </PopoverTrigger>
        <PopoverContent data-testid="tour-step-4">
          <p>Gere um PDF demonstrativo.</p>
          <Button size="sm" className="mt-2" asChild>
            <a href="/beta">Entrar na Beta</a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={resetTour}
          >
            Reiniciar
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

