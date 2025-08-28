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
                      <TableHead>Reclamante_Limpo</TableHead>
                      <TableHead>Reu_Nome</TableHead>
                      <TableHead className="text-muted-foreground">UF</TableHead>
                      <TableHead className="text-muted-foreground">Comarca</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processoExamples.map((exemplo, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{exemplo.CNJ}</TableCell>
                        <TableCell>{exemplo.Reclamante_Limpo}</TableCell>
                        <TableCell>{exemplo.Reu_Nome}</TableCell>
                        <TableCell className="text-muted-foreground">{exemplo.UF}</TableCell>
                        <TableCell className="text-muted-foreground">{exemplo.Comarca}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Campos em cinza são opcionais e aceitos pelo importador
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
                      <TableHead>Nome_Testemunha</TableHead>
                      <TableHead>CNJs_Como_Testemunha</TableHead>
                      <TableHead className="text-muted-foreground">Reclamante_Nome</TableHead>
                      <TableHead className="text-muted-foreground">Reu_Nome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testemunhaExamples.map((exemplo, index) => (
                      <TableRow key={index}>
                        <TableCell>{exemplo.Nome_Testemunha}</TableCell>
                        <TableCell className="font-mono text-xs max-w-xs truncate">
                          {exemplo.CNJs_Como_Testemunha}
                        </TableCell>
                        <TableCell className="text-muted-foreground italic">
                          {exemplo.Reclamante_Nome || '(join automático)'}
                        </TableCell>
                        <TableCell className="text-muted-foreground italic">
                          {exemplo.Reu_Nome || '(auto-fill)'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground mt-2">
                <p>* Formatos aceitos para CNJs_Como_Testemunha:</p>
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