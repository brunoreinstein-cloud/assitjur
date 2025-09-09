import { createClient } from "npm:@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const processos = body?.processos as any[] | undefined;
    const testemunhas = body?.testemunhas as any[] | undefined;

    if ((!processos || !Array.isArray(processos)) && (!testemunhas || !Array.isArray(testemunhas))) {
      throw new Error("Missing required data: processos or testemunhas array");
    }

    // Get user's tenant_id from JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      throw new Error("Invalid user token");
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      throw new Error("User organization not found");
    }

    const tenantId = profile.organization_id;

    console.log(`Processing import for tenant ${tenantId}`);
    console.log(`Processos: ${processos?.length || 0} rows`);
    console.log(`Testemunhas: ${testemunhas?.length || 0} rows`);

    // Collect unique process numbers and witness names
    const processNumbers = new Set<string>();
    const witnessNames = new Set<string>();
    const links: { cnj: string; witness: string }[] = [];

    if (Array.isArray(processos)) {
      processos.forEach((row) => {
        const cnjDigits = String(row.cnj || "").replace(/[^\d]/g, "");
        if (cnjDigits.length !== 20) return;
        processNumbers.add(cnjDigits);

        const ativo: string[] = Array.isArray(row.testemunhas_ativo) ? row.testemunhas_ativo : [];
        const passivo: string[] = Array.isArray(row.testemunhas_passivo) ? row.testemunhas_passivo : [];

        [...ativo, ...passivo].forEach((name) => {
          if (!name || typeof name !== "string") return;
          const clean = name.trim();
          if (!clean) return;
          witnessNames.add(clean);
          links.push({ cnj: cnjDigits, witness: clean });
        });
      });
    }

    if (Array.isArray(testemunhas)) {
      testemunhas.forEach((row) => {
        const cnjDigits = String(row.cnj || row.cnj_digits || "").replace(/[^\d]/g, "");
        const name = (row.nome_testemunha || row.nome || "").trim();
        if (cnjDigits.length !== 20 || !name) return;
        processNumbers.add(cnjDigits);
        witnessNames.add(name);
        links.push({ cnj: cnjDigits, witness: name });
      });
    }

    if (processNumbers.size === 0 || links.length === 0) {
      throw new Error("No valid records found. Check CNJ format and witness names.");
    }

    // Upsert processes
    const processosToUpsert = Array.from(processNumbers).map((numero) => ({
      numero,
      tenant_id: tenantId,
    }));

    const { data: upsertedProcessos, error: processosError } = await supabase
      .from("assistjur.processos")
      .upsert(processosToUpsert, {
        onConflict: "tenant_id,numero",
        ignoreDuplicates: false,
      })
      .select();

    if (processosError) {
      throw processosError;
    }

    const processoIdMap = new Map<string, string>();
    upsertedProcessos?.forEach((p: any) => processoIdMap.set(p.numero, p.id));

    if (processoIdMap.size < processNumbers.size) {
      const missing = Array.from(processNumbers).filter((n) => !processoIdMap.has(n));
      if (missing.length) {
        const { data: fetched } = await supabase
          .from("assistjur.processos")
          .select("id,numero")
          .eq("tenant_id", tenantId)
          .in("numero", missing);
        fetched?.forEach((p: any) => processoIdMap.set(p.numero, p.id));
      }
    }

    // Upsert testemunhas
    const testemunhasToUpsert = Array.from(witnessNames).map((nome) => ({
      nome,
      tenant_id: tenantId,
    }));

    const { data: upsertedTestemunhas, error: testemunhasError } = await supabase
      .from("assistjur.testemunhas")
      .upsert(testemunhasToUpsert, {
        onConflict: "tenant_id,nome",
        ignoreDuplicates: false,
      })
      .select();

    if (testemunhasError) {
      throw testemunhasError;
    }

    const testemunhaIdMap = new Map<string, string>();
    upsertedTestemunhas?.forEach((t: any) => testemunhaIdMap.set(t.nome, t.id));

    if (testemunhaIdMap.size < witnessNames.size) {
      const missing = Array.from(witnessNames).filter((n) => !testemunhaIdMap.has(n));
      if (missing.length) {
        const { data: fetched } = await supabase
          .from("assistjur.testemunhas")
          .select("id,nome")
          .eq("tenant_id", tenantId)
          .in("nome", missing);
        fetched?.forEach((t: any) => testemunhaIdMap.set(t.nome, t.id));
      }
    }

    // Build relationships
    const joinData = links
      .map(({ cnj, witness }) => {
        const processo_id = processoIdMap.get(cnj);
        const testemunha_id = testemunhaIdMap.get(witness);
        if (processo_id && testemunha_id) {
          return {
            processo_id,
            testemunha_id,
            tenant_id: tenantId,
          };
        }
        return null;
      })
      .filter((r): r is { processo_id: string; testemunha_id: string; tenant_id: string } => r !== null);

    if (joinData.length === 0) {
      throw new Error("No valid process-witness relationships found.");
    }

    const { error: joinError } = await supabase
      .from("assistjur.processos_testemunhas")
      .upsert(joinData, {
        onConflict: "processo_id,testemunha_id",
        ignoreDuplicates: true,
      });

    if (joinError) {
      throw joinError;
    }

    const result = {
      processos: processosToUpsert.length,
      testemunhas: testemunhasToUpsert.length,
      vinculacoes: joinData.length,
    };

    console.log("Import completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

