import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';

// JWT verification function
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error('Failed to decode JWT: ' + error.message);
  }
}

// Encrypt OpenAI key (simple base64 for now - in production use proper encryption)
function encryptKey(key: string): string {
  return btoa(key);
}

// Decrypt OpenAI key
function decryptKey(encryptedKey: string): string {
  return atob(encryptedKey);
}

// Validate OpenAI key format
function validateOpenAIKey(key: string): boolean {
  return key.startsWith('sk-') && key.length >= 20;
}

// Test OpenAI key validity
async function testOpenAIKey(key: string): Promise<{ valid: boolean; model?: string; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { valid: true, model: data.data?.[0]?.id || 'unknown' };
    } else {
      return { valid: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  console.log('🔑 OpenAI Keys Management Function');
  console.log('Method:', req.method, 'URL:', req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Decoding JWT token...');
    
    // Decode JWT to get user info
    const payload = decodeJWT(token);
    const userId = payload.sub;
    
    if (!userId) {
      throw new Error('Invalid token: no user ID found');
    }
    
    console.log('✅ User ID from JWT:', userId);

    // Create service role client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user profile and verify admin role
    console.log('👤 Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError);
      throw new Error('User profile not found');
    }

    if (profile.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    const orgId = profile.organization_id;
    console.log('✅ Admin user verified for org:', orgId);

    // Handle different HTTP methods
    if (req.method === 'GET') {
      // List organization's OpenAI keys
      const { data: keys, error } = await supabase
        .from('openai_keys')
        .select('id, alias, last_four, is_active, created_at, last_used_at, created_by')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw new Error('Failed to fetch keys: ' + error.message);

      return new Response(JSON.stringify({ keys }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body for POST/PUT/DELETE
    const body = await req.json();
    console.log('📝 Request body:', { ...body, key: body.key ? 'sk-***' : undefined });

    if (req.method === 'POST') {
      const { action, alias, key, notes, test } = body;

      if (action === 'create') {
        // Validate inputs
        if (!alias || !key) {
          throw new Error('Alias and key are required');
        }

        if (!validateOpenAIKey(key)) {
          throw new Error('Invalid OpenAI key format');
        }

        // Test key if requested
        let testResult = null;
        if (test) {
          console.log('🧪 Testing OpenAI key...');
          testResult = await testOpenAIKey(key);
          if (!testResult.valid) {
            throw new Error(`Invalid OpenAI key: ${testResult.error}`);
          }
        }

        // Check for duplicate alias
        const { data: existing } = await supabase
          .from('openai_keys')
          .select('id')
          .eq('org_id', orgId)
          .eq('alias', alias)
          .single();

        if (existing) {
          throw new Error('Alias already exists');
        }

        // Create new key
        const { data: newKey, error } = await supabase
          .from('openai_keys')
          .insert({
            org_id: orgId,
            alias,
            encrypted_key: encryptKey(key),
            last_four: key.slice(-4),
            created_by: userId,
            is_active: true
          })
          .select('id, alias, last_four, is_active, created_at')
          .single();

        if (error) throw new Error('Failed to create key: ' + error.message);

        console.log('✅ Key created successfully:', newKey.id);
        return new Response(JSON.stringify({ 
          success: true, 
          key: newKey,
          test_result: testResult 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else if (action === 'test') {
        const { key_id } = body;
        
        // Get encrypted key
        const { data: keyData, error } = await supabase
          .from('openai_keys')
          .select('encrypted_key')
          .eq('id', key_id)
          .eq('org_id', orgId)
          .single();

        if (error || !keyData) {
          throw new Error('Key not found');
        }

        const decryptedKey = decryptKey(keyData.encrypted_key);
        const testResult = await testOpenAIKey(decryptedKey);

        // Update last_used_at if valid
        if (testResult.valid) {
          await supabase
            .from('openai_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', key_id);
        }

        return new Response(JSON.stringify({ test_result: testResult }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else {
        throw new Error('Invalid action');
      }
    }

    if (req.method === 'PUT') {
      const { key_id, alias, notes } = body;
      
      const { data: updatedKey, error } = await supabase
        .from('openai_keys')
        .update({ alias, updated_at: new Date().toISOString() })
        .eq('id', key_id)
        .eq('org_id', orgId)
        .select('id, alias, last_four, is_active, created_at')
        .single();

      if (error) throw new Error('Failed to update key: ' + error.message);

      return new Response(JSON.stringify({ success: true, key: updatedKey }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'DELETE') {
      const { key_id } = body;
      
      const { error } = await supabase
        .from('openai_keys')
        .delete()
        .eq('id', key_id)
        .eq('org_id', orgId);

      if (error) throw new Error('Failed to delete key: ' + error.message);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('💥 Function error:', error.message);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});