import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { processoSamples, testemunhaSamples } from '@/lib/templates/samples';

export function Examples() {
  // Mostrar apenas 3 exemplos de cada
  const processoExamples = processoSamples.slice(0, 3);
  const testemunhaExamples = testemunhaSamples.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplos Visuais dos Templates</CardTitle>
        <CardDescription>
          Visualize como os dados devem estar organizados nas planilhas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Exemplos Por Processo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exemplos - Aba "Por Processo"</CardTitle>
              <CardDescription>
                Cada linha representa um processo com campos obrigatórios preenchidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CNJ</TableHead>
                        <TableHead>UF</TableHead>
                        <TableHead>Comarca</TableHead>
                        <TableHead>Reclamante</TableHead>
                        <TableHead>Réu</TableHead>
                        <TableHead>Advogados Ativo</TableHead>
                        <TableHead>Todas Testemunhas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processoExamples.map((exemplo, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">{exemplo.cnj}</TableCell>
                          <TableCell>{exemplo.uf}</TableCell>
                          <TableCell>{exemplo.comarca}</TableCell>
                          <TableCell>{exemplo.reclamante_nome}</TableCell>
                          <TableCell>{exemplo.reu_nome}</TableCell>
                          <TableCell className="text-xs max-w-32 truncate">{exemplo.advogados_ativo}</TableCell>
                          <TableCell className="text-xs max-w-32 truncate">{exemplo.todas_testemunhas}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Campos obrigatórios:</strong> cnj, uf, comarca, reclamante_nome, reu_nome, advogados_ativo, todas_testemunhas
              </p>
            </CardContent>
          </Card>

          {/* Exemplos Por Testemunha */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exemplos - Aba "Por Testemunha"</CardTitle>
              <CardDescription>
                Cada linha representa uma testemunha com lista de CNJs em diferentes formatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Testemunha</TableHead>
                        <TableHead>Qtd Depoimentos</TableHead>
                        <TableHead>CNJs Como Testemunha</TableHead>
                        <TableHead className="text-muted-foreground">Reclamante</TableHead>
                        <TableHead className="text-muted-foreground">Réu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testemunhaExamples.map((exemplo, index) => (
                        <TableRow key={index}>
                          <TableCell>{exemplo.nome_testemunha}</TableCell>
                          <TableCell className="text-center">{exemplo.qtd_depoimentos}</TableCell>
                          <TableCell className="font-mono text-xs max-w-xs truncate">
                            {exemplo.cnjs_como_testemunha}
                          </TableCell>
                          <TableCell className="text-muted-foreground italic">
                            {exemplo.reclamante_nome || '(join automático)'}
                          </TableCell>
                          <TableCell className="text-muted-foreground italic">
                            {exemplo.reu_nome || '(auto-fill)'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground mt-2">
                <p><strong>Campos obrigatórios:</strong> nome_testemunha, qtd_depoimentos, cnjs_como_testemunha</p>
                <p><strong>Formatos aceitos para cnjs_como_testemunha:</strong></p>
                <p>• JSON-like: ['CNJ1','CNJ2']</p>
                <p>• Separado por ;: CNJ1; CNJ2</p>
                <p>• Separado por ,: CNJ1, CNJ2</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}