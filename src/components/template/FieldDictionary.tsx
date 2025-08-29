import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dicionarioFields } from '@/lib/templates/samples';

export function FieldDictionary() {
  const processoFields = dicionarioFields.filter(f => f.Aba === 'Por Processo');
  const testemunhaFields = dicionarioFields.filter(f => f.Aba === 'Por Testemunha');

  const renderFieldTable = (fields: typeof dicionarioFields, title: string, description: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {title === 'Aba "Por Processo"' ? '⚖️' : '👤'}
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-32">Campo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Obrigatório</TableHead>
                <TableHead>Regra de Validação</TableHead>
                <TableHead className="min-w-40">Exemplo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm font-medium">
                    {field.Campo}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {field.Tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={field.Obrigatorio === 'Sim' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {field.Obrigatorio}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">
                    {field.Regra}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground break-all">
                    {field.Exemplo}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dicionário de Campos</CardTitle>
        <CardDescription>
          <div className="space-y-1 text-sm">
            <p><strong>CONFORMIDADE COM NOVAS ESPECIFICAÇÕES:</strong></p>
            <p>✅ <strong>Abas obrigatórias:</strong> "Por Processo" + "Por Testemunha"</p>
            <p>✅ <strong>Campos obrigatórios Por Processo:</strong> cnj, uf, comarca, reclamante_nome, reu_nome, advogados_ativo, todas_testemunhas</p>
            <p>✅ <strong>Campos obrigatórios Por Testemunha:</strong> nome_testemunha, qtd_depoimentos, cnjs_como_testemunha</p>
            <p>✅ <strong>Sistema de sinônimos:</strong> Reconhece variações de nomes de colunas automaticamente</p>
            <p>✅ <strong>Parser de listas:</strong> Suporta formatos JSON-like, separação por ; e ,</p>
            <p>✅ <strong>CNJ preservado:</strong> Formato original mantido como string</p>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="processo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processo">Por Processo</TabsTrigger>
            <TabsTrigger value="testemunha">Por Testemunha</TabsTrigger>
          </TabsList>
          <TabsContent value="processo" className="space-y-4 mt-6">
            {renderFieldTable(
              processoFields, 
              'Aba "Por Processo"',
              'Dados de processos judiciais com validação rigorosa de CNJ e campos obrigatórios'
            )}
          </TabsContent>
          <TabsContent value="testemunha" className="space-y-4 mt-6">
            {renderFieldTable(
              testemunhaFields, 
              'Aba "Por Testemunha"',
              'Dados de testemunhas com lista de CNJs dos processos onde atuaram como testemunhas'
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}