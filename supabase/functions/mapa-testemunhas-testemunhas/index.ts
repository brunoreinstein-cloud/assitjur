import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
  {
    auth: { persistSession: false }
  }
);

Deno.serve(async (req) => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  
  // Handle CORS preflight
  const preflightResponse = handlePreflight(req, cid);
  if (preflightResponse) return preflightResponse;

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: { ...corsHeaders(req, cid), "x-correlation-id": cid }
      });
    }

    // Parse request body
    let body: any = {};
    if (req.method !== "GET") {
      const contentType = req.headers.get("Content-Type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
          status: 400,
          headers: { ...corsHeaders(req, cid), "x-correlation-id": cid }
        });
      }
      
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
          status: 400,
          headers: { ...corsHeaders(req, cid), "x-correlation-id": cid }
        });
      }
    }

    const page = Number(body?.page ?? 1);
    const limit = Math.min(Number(body?.limit ?? 20), 100);

    if (!Number.isFinite(page) || page < 1) {
      return new Response(JSON.stringify({ error: "Invalid 'page' (must be integer >= 1)" }), {
        status: 400,
        headers: { ...corsHeaders(req, cid), "x-correlation-id": cid }
      });
    }
    
    if (!Number.isFinite(limit) || limit < 1) {
      return new Response(JSON.stringify({ error: "Invalid 'limit' (must be integer >= 1)" }), {
        status: 400,
        headers: { ...corsHeaders(req, cid), "x-correlation-id": cid }
      });
    }

    console.log(`[cid=${cid}] Fetching testemunhas: page=${page}, limit=${limit}`);

    // Create client with user's token for RLS
    const userSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        auth: { persistSession: false },
        global: { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      }
    );

    // For now, return mock data since the actual tables might not exist yet
    const mockData = [
      {
        nome: "João Silva",
        qtd_testemunhos: 3,
        polo_ativo_autor: 1,
        polo_ativo_testemunha: 2,
        polo_passivo_reu: 0,
        polo_passivo_testemunha: 0,
        troca_favor: false,
        triangulacao: false,
        created_at: new Date().toISOString()
      },
      {
        nome: "Maria Santos",
        qtd_testemunhos: 5,
        polo_ativo_autor: 2,
        polo_ativo_testemunha: 3,
        polo_passivo_reu: 1,
        polo_passivo_testemunha: 1,
        troca_favor: true,
        triangulacao: false,
        created_at: new Date().toISOString()
      }
    ];

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = mockData.slice(startIndex, endIndex);

    return new Response(JSON.stringify({ 
      data: paginatedData, 
      total: mockData.length,
      page,
      limit
    }), {
      status: 200,
      headers: { ...corsHeaders(req, cid), "x-correlation-id": cid }
    });

  } catch (error) {
    console.error(`[cid=${cid}] Unhandled error:`, error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders(req, cid), "x-correlation-id": cid }
    });
  }
});