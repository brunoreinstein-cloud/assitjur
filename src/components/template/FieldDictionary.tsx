import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dicionarioFields } from '@/lib/templates/samples';

export function FieldDictionary() {
  const processoFields = dicionarioFields.filter(f => f.Aba === 'Por Processo');
  const testemunhaFields = dicionarioFields.filter(f => f.Aba === 'Por Testemunha');

  const renderFieldTable = (fields: typeof dicionarioFields) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campo</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Obrigatório</TableHead>
          <TableHead>Regra</TableHead>
          <TableHead>Exemplo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{field.Campo}</TableCell>
            <TableCell className="text-muted-foreground">{field.Tipo}</TableCell>
            <TableCell>
              <Badge variant={field.Obrigatorio === 'Sim' ? 'destructive' : 'secondary'}>
                {field.Obrigatorio}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{field.Regra}</TableCell>
            <TableCell className="text-sm font-mono bg-muted/50 rounded px-2 py-1">
              {field.Exemplo}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dicionário de Campos</CardTitle>
        <CardDescription>
          Especificação completa dos campos aceitos pelo importador
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="processo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processo">Por Processo</TabsTrigger>
            <TabsTrigger value="testemunha">Por Testemunha</TabsTrigger>
          </TabsList>
          
          <TabsContent value="processo" className="mt-4">
            <div className="rounded-md border">
              {renderFieldTable(processoFields)}
            </div>
          </TabsContent>
          
          <TabsContent value="testemunha" className="mt-4">
            <div className="rounded-md border">
              {renderFieldTable(testemunhaFields)}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}