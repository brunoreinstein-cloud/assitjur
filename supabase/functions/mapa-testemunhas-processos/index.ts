import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { normalizeMapaRequest, MapaResponseSchema } from '../_shared/mapa-contracts.ts';

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

    // Normalize and validate request
    let dto;
    try {
      dto = normalizeMapaRequest(body);
    } catch (e) {
      console.error(`[cid=${cid}] Validation failed:`, e);
      return new Response(JSON.stringify({ 
        error: "Validation failed", 
        details: e instanceof Error ? e.message : String(e)
      }), {
        status: 400,
        headers: { ...corsHeaders(req, cid), "x-correlation-id": cid }
      });
    }

    console.log(`[cid=${cid}] Fetching processos:`, dto);

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
        cnj: "1234567-89.2023.4.05.6789",
        status: "Em andamento",
        fase: "Instrução",
        testemunhas: ["João Silva", "Maria Santos"],
        uf: "SP",
        troca_direta: false,
        triangulacao: true,
        created_at: new Date().toISOString()
      },
      {
        cnj: "9876543-21.2023.4.05.1234",
        status: "Finalizado",
        fase: "Sentença",
        testemunhas: ["Carlos Oliveira"],
        uf: "RJ",
        troca_direta: true,
        triangulacao: false,
        created_at: new Date().toISOString()
      }
    ];

    const startIndex = (dto.page - 1) * dto.limit;
    const endIndex = startIndex + dto.limit;
    const paginatedData = mockData.slice(startIndex, endIndex);

    const result = { 
      data: paginatedData, 
      total: mockData.length
    };

    // Validate response
    const validation = MapaResponseSchema.safeParse(result);
    if (!validation.success) {
      console.error(`[cid=${cid}] Invalid response:`, validation.error.issues);
      return new Response(JSON.stringify({ error: "Invalid server response" }), {
        status: 500,
        headers: { ...corsHeaders(req, cid), "x-correlation-id": cid }
      });
    }

    return new Response(JSON.stringify(result), {
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