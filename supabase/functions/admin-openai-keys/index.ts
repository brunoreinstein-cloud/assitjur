import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Encrypt API key using Web Crypto API
async function encrypt(plainText: string): Promise<string> {
  const keyB64 = Deno.env.get('OPENAI_KEY_ENC_KEY');
  if (!keyB64) throw new Error('OPENAI_KEY_ENC_KEY missing');
  
  const key = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const cryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, new TextEncoder().encode(plainText));
  
  const payload = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
  return btoa(String.fromCharCode(...payload));
}

// Decrypt API key using Web Crypto API
async function decrypt(encryptedData: string): Promise<string> {
  const keyB64 = Deno.env.get('OPENAI_KEY_ENC_KEY');
  if (!keyB64) throw new Error('OPENAI_KEY_ENC_KEY missing');
  
  const key = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
  const buffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const iv = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);
  
  const cryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
  
  return new TextDecoder().decode(decrypted);
}

// Test OpenAI API key
async function testApiKey(apiKey: string): Promise<{ valid: boolean; model?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        valid: true, 
        model: data.data?.[0]?.id || 'gpt-4o-mini' 
      };
    }
    
    return { valid: false };
  } catch (error) {
    console.error('OpenAI API test error:', error);
    return { valid: false };
  }
}

// RBAC Guard - Check if user is ADMIN
async function requireAdmin(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('user_id', userId)
    .single();

  if (error || !profile || profile.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  return profile;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin permissions
    const profile = await requireAdmin(supabase, user.id);

    const { action, alias, key: apiKey, notes, keyId } = await req.json();

    switch (action) {
      case 'create': {
        if (!alias || !apiKey) {
          return new Response(
            JSON.stringify({ error: 'alias e key são obrigatórios' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Test key before saving
        const testResult = await testApiKey(apiKey);
        if (!testResult.valid) {
          return new Response(
            JSON.stringify({ error: 'Chave inválida - verifique o formato ou permissões' }),
            { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const encryptedKey = await encrypt(apiKey);
        const lastFour = apiKey.slice(-4);

        const { error } = await supabase
          .from('openai_keys')
          .insert({
            org_id: profile.organization_id,
            alias,
            last_four: lastFour,
            encrypted_key: encryptedKey,
            notes: notes || null,
            created_by: user.id,
          });

        if (error) {
          console.error('Database insert error:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'test': {
        if (!keyId) {
          return new Response(
            JSON.stringify({ error: 'keyId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: keyData, error: keyError } = await supabase
          .from('openai_keys')
          .select('encrypted_key')
          .eq('id', keyId)
          .eq('org_id', profile.organization_id)
          .single();

        if (keyError || !keyData?.encrypted_key) {
          return new Response(
            JSON.stringify({ error: 'Chave não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const decryptedKey = await decrypt(keyData.encrypted_key);
        const testResult = await testApiKey(decryptedKey);

        // Update last_used_at if valid
        if (testResult.valid) {
          await supabase
            .from('openai_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', keyId);
        }

        return new Response(
          JSON.stringify(testResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!keyId) {
          return new Response(
            JSON.stringify({ error: 'keyId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('openai_keys')
          .delete()
          .eq('id', keyId)
          .eq('org_id', profile.organization_id);

        if (error) {
          console.error('Database delete error:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'rotate': {
        // Note: OpenAI doesn't provide key rotation API
        return new Response(
          JSON.stringify({ 
            error: 'Rotação automática não suportada pela OpenAI. Por favor, gere uma nova chave manualmente no painel da OpenAI.' 
          }),
          { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Edge function error:', error);
    
    if (error.message.includes('Admin access required')) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado — apenas Administrador pode gerenciar chaves.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});