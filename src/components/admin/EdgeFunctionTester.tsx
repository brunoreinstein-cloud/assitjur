import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const EdgeFunctionTester = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);
    
    const newResults: TestResult[] = [];

    try {
      // Get session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      
      if (!jwt) {
        newResults.push({
          test: 'Authorization',
          status: 'error',
          message: 'Sem sessão ativa. Faça login.',
          details: 'No JWT token available'
        });
        setResults(newResults);
        setTesting(false);
        return;
      }

      // Test 1: Basic connectivity
      try {
        const response = await fetch('https://fgjypmlszuzkgvhuszxn.functions.supabase.co/import-into-version', {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });
        
        newResults.push({
          test: 'Basic Connectivity',
          status: response.ok ? 'success' : 'error',
          message: `Response: ${response.status} ${response.statusText}`,
          details: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          }
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        newResults.push({
          test: 'Basic Connectivity',
          status: 'error',
          message: `Connection failed: ${message}`,
          details: error
        });
      }

      // Test 2: CORS Preflight
      try {
        const response = await fetch('https://fgjypmlszuzkgvhuszxn.functions.supabase.co/import-into-version', {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization, content-type, apikey'
          }
        });
        
        const corsOrigin = response.headers.get('access-control-allow-origin');
        const corsMethods = response.headers.get('access-control-allow-methods');
        
        newResults.push({
          test: 'CORS Preflight',
          status: corsOrigin === '*' ? 'success' : 'error',
          message: `Origin: ${corsOrigin}, Methods: ${corsMethods}`,
          details: {
            status: response.status,
            corsHeaders: {
              'access-control-allow-origin': corsOrigin,
              'access-control-allow-methods': corsMethods,
              'access-control-allow-headers': response.headers.get('access-control-allow-headers')
            }
          }
        });
      } catch (error) {
        newResults.push({
          test: 'CORS Preflight',
          status: 'error',
          message: `CORS test failed: ${error instanceof Error ? error.message : String(error)}`,
          details: error
        });
      }

      // Test 3: Authentication
      try {
        const { data: testData, error: testError } = await supabase.functions.invoke('import-into-version', {
          body: { test: true, data: [] }
        });
        
        newResults.push({
          test: 'Authentication & Function Call',
          status: testError ? 'error' : 'success',
          message: testError ? `Auth failed: ${testError.message}` : 'Authentication successful',
          details: { testData, testError }
        });
      } catch (error) {
        newResults.push({
          test: 'Authentication & Function Call',
          status: 'error',
          message: `Function call failed: ${error instanceof Error ? error.message : String(error)}`,
          details: error
        });
      }

      // Test 4: Small payload test
      try {
        const testProcessos = [{
          cnj: '12345678901234567890',
          cnj_digits: '12345678901234567890',
          reclamante_limpo: 'Test Reclamante',
          reu_nome: 'Test Reu'
        }];

        const { data: createVersionData, error: createVersionError } = await supabase.functions.invoke('create-version', {
          body: { description: 'Test version for diagnostics' }
        });

        if (createVersionError) throw createVersionError;

        const { data: importData, error: importError } = await supabase.functions.invoke('import-into-version', {
          body: {
            versionId: createVersionData.versionId,
            data: testProcessos,
            fileChecksum: 'test-checksum'
          }
        });
        
        newResults.push({
          test: 'Small Payload Import',
          status: importError ? 'error' : 'success',
          message: importError ? `Import failed: ${importError.message}` : `Import successful: ${importData?.summary?.imported || 0} records`,
          details: { importData, importError, versionId: createVersionData.versionId }
        });
      } catch (error) {
        newResults.push({
          test: 'Small Payload Import',
          status: 'error',
          message: `Payload test failed: ${error instanceof Error ? error.message : String(error)}`,
          details: error
        });
      }

    } finally {
      setResults(newResults);
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Edge Function Diagnostics</CardTitle>
        <CardDescription>
          Test connectivity and CORS configuration for import-into-version function
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{result.test}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer">View Details</summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};