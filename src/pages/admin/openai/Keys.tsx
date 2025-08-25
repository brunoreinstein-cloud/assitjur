import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Key, TestTube, RotateCw, Eye, EyeOff, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const OpenAIKeys = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [newKey, setNewKey] = useState({
    alias: '',
    key: '',
    notes: ''
  });
  const [testingKey, setTestingKey] = useState<string | null>(null);

  // Fetch API keys
  const { data: keys, isLoading } = useQuery({
    queryKey: ['openai-keys', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('openai_keys')
        .select('*')
        .eq('org_id', profile?.organization_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Add new key
  const addKeyMutation = useMutation({
    mutationFn: async (keyData: typeof newKey) => {
      console.log('=== FIXED AUTH APPROACH ===');
      console.log('Starting at:', new Date().toISOString());
      
      try {
        // Get fresh session with explicit refresh
        console.log('🔄 Getting fresh session...');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw new Error('Falha na autenticação: ' + sessionError.message);
        }
        
        let session = initialSession;
        
        if (!session || !session.access_token) {
          console.error('❌ No valid session or access token');
          // Try to refresh the session
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          if (!refreshedSession) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
          console.log('✅ Session refreshed');
          session = refreshedSession;
        }
        
        console.log('✅ Valid session found, token length:', session.access_token.length);
        console.log('✅ Token expires at:', new Date(session.expires_at * 1000).toISOString());

        // Use supabase.functions.invoke with fresh session
        console.log('🚀 Calling function with supabase.functions.invoke...');
        const result = await supabase.functions.invoke('admin-openai-keys', {
          body: { 
            action: 'create',
            alias: keyData.alias,
            key: keyData.key,
            notes: keyData.notes,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });
        
        console.log('📡 Function result:', result);
        console.log('📡 Result data:', result.data);
        console.log('📡 Result error:', result.error);
        
        if (result.error) {
          console.error('❌ Function returned error:', result.error);
          throw new Error(`Erro na função: ${result.error.message || result.error}`);
        }
        
        if (!result.data) {
          console.error('❌ No data returned');
          throw new Error('Nenhum dado retornado da função');
        }
        
        console.log('✅ Success:', result.data);
        return result.data;

      } catch (error) {
        console.error('=== FINAL ERROR ===');
        console.error('Error type:', error.constructor?.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        throw new Error(`Falha ao salvar chave: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-keys'] });
      setIsAddDialogOpen(false);
      setNewKey({ alias: '', key: '', notes: '' });
      toast({
        title: "Chave adicionada",
        description: "Chave API foi salva com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao salvar chave: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Test key
  const testKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-openai-keys', {
        body: { 
          action: 'test',
          keyId,
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, keyId) => {
      setTestingKey(null);
      toast({
        title: data.valid ? "Chave válida" : "Chave inválida",
        description: data.valid 
          ? "Conexão com OpenAI estabelecida com sucesso." 
          : "Chave inválida (401). Verifique ou rotacione a credencial.",
        variant: data.valid ? "default" : "destructive",
      });
    },
    onError: (error, keyId) => {
      setTestingKey(null);
      toast({
        title: "Erro no teste",
        description: "Falha ao testar chave: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Rotate key
  const rotateKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.functions.invoke('admin-openai-keys', {
        body: { 
          action: 'rotate',
          keyId,
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-keys'] });
      toast({
        title: "Chave rotacionada",
        description: "Nova chave foi gerada e salva.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao rotacionar chave: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Delete key
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.functions.invoke('admin-openai-keys', {
        body: { 
          action: 'delete',
          keyId,
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-keys'] });
      toast({
        title: "Chave removida",
        description: "Chave API foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao remover chave: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestKey = (keyId: string) => {
    setTestingKey(keyId);
    testKeyMutation.mutate(keyId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Chaves OpenAI</h1>
          <p className="text-muted-foreground">
            Configure e monitore suas chaves da API OpenAI
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Chave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Chave API</DialogTitle>
              <DialogDescription>
                As chaves são armazenadas apenas no servidor. Nunca exibimos o valor completo.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="alias">Nome/Apelido</Label>
                <Input
                  id="alias"
                  placeholder="Ex: Chave Principal"
                  value={newKey.alias}
                  onChange={(e) => setNewKey({ ...newKey, alias: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="key">Chave API</Label>
                <div className="relative">
                  <Input
                    id="key"
                    type={showKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={newKey.key}
                    onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Descrição ou notas sobre esta chave..."
                  value={newKey.notes}
                  onChange={(e) => setNewKey({ ...newKey, notes: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  console.log('=== Submit button clicked ===');
                  console.log('newKey state:', {
                    alias: newKey.alias,
                    key: newKey.key ? 'present' : 'missing',
                    notes: newKey.notes
                  });
                  console.log('Form validation:', {
                    aliasValid: !!newKey.alias,
                    keyValid: !!newKey.key,
                    isPending: addKeyMutation.isPending
                  });
                  
                  if (!newKey.alias || !newKey.key) {
                    console.error('Form validation failed');
                    return;
                  }
                  
                  console.log('Calling addKeyMutation.mutate');
                  addKeyMutation.mutate(newKey);
                }}
                disabled={!newKey.alias || !newKey.key || addKeyMutation.isPending}
              >
                {addKeyMutation.isPending ? "Salvando..." : "Salvar Chave"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Key className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-blue-800 text-sm">
              <p className="font-medium mb-1">Segurança das Chaves</p>
              <p>
                As chaves são armazenadas criptografadas no servidor e nunca expostas no cliente. 
                Apenas os últimos 4 dígitos são exibidos para identificação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chaves Cadastradas</CardTitle>
          <CardDescription>
            {keys?.length || 0} chave(s) configurada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!keys?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma chave API configurada</p>
              <p className="text-sm">Adicione uma chave para começar a usar a integração OpenAI</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Uso</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.alias}</TableCell>
                    <TableCell className="font-mono">***{key.last_four}</TableCell>
                    <TableCell>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {key.last_used_at 
                        ? format(new Date(key.last_used_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : "Nunca"
                      }
                    </TableCell>
                    <TableCell>
                      {format(new Date(key.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestKey(key.id)}
                          disabled={testingKey === key.id}
                        >
                          {testingKey === key.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rotateKeyMutation.mutate(key.id)}
                          disabled={rotateKeyMutation.isPending}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Chave</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover a chave "{key.alias}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteKeyMutation.mutate(key.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenAIKeys;