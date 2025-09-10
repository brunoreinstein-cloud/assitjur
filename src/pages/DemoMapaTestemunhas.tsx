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
  const closeTour = () => setStep(-1);

  const riskColor = (risco: Witness['risco']) =>
    risco === 'Alto' ? 'text-red-600' : risco === 'Médio' ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mapa de Testemunhas (Demo)</h1>

      <div className="flex gap-4">
        <Popover open={step === 0} onOpenChange={(o) => !o && closeTour()}>
          <PopoverTrigger asChild>
            <Button>Novo Mapa</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p>Crie um novo mapa de testemunhas.</p>
            <Button size="sm" className="mt-2" onClick={next}>
              Próximo
            </Button>
          </PopoverContent>
        </Popover>

        <Popover open={step === 1} onOpenChange={(o) => !o && closeTour()}>
          <PopoverTrigger asChild>
            <Button variant="outline">Importar do CNJ (mock)</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p>Simule a importação de dados do CNJ.</p>
            <Button size="sm" className="mt-2" onClick={next}>
              Próximo
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <Popover open={step === 2} onOpenChange={(o) => !o && closeTour()}>
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
        <PopoverContent>
          <p>Revise as testemunhas e seus vínculos.</p>
          <Button size="sm" className="mt-2" onClick={next}>
            Próximo
          </Button>
        </PopoverContent>
      </Popover>

      <Popover open={step === 3} onOpenChange={(o) => !o && closeTour()}>
        <PopoverTrigger asChild>
          <div className="h-40 border rounded flex items-center justify-center text-muted-foreground">
            Mini grafo (placeholder)
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <p>Visualize as relações no grafo.</p>
          <Button size="sm" className="mt-2" onClick={next}>
            Próximo
          </Button>
        </PopoverContent>
      </Popover>

      <Popover open={step === 4} onOpenChange={(o) => !o && closeTour()}>
        <PopoverTrigger asChild>
          <Button>Gerar PDF (mock)</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p>Gere um PDF demonstrativo.</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" asChild>
              <a href="/beta">Entrar na Beta</a>
            </Button>
            <Button size="sm" variant="ghost" onClick={resetTour}>
              Reiniciar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

