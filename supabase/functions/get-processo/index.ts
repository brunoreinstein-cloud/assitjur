import { serve } from "http-server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const handler = async (req: Request): Promise<Response> => {
  const cid = req.headers.get("x-correlation-id") ?? randomUUID();
  const log = (...args: unknown[]) => console.log(cid, ...args);
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "content-type": "application/json",
        "x-correlation-id": cid,
      },
    });

  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      log("missing bearer token");
      return json(401, { error: "unauthorized" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: auth, "x-correlation-id": cid } },
      }
    );

    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError) {
      log("invalid jwt", authError.message);
      return json(401, { error: "unauthorized" });
    }
    log("user", user?.id);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("processo_id");
    if (!id) {
      log("missing processo_id");
      return json(400, { error: "missing processo_id" });
    }

    const { data, error } = await supabase
      .from("processos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        log("not found");
        return json(404, { error: "not_found" });
      }
      if (error.code === "42501") {
        log("forbidden", error.message);
        return json(403, { error: "forbidden" });
      }
      log("db error", error.message);
      return json(500, { error: "db_error", detail: error.message });
    }

    log("success");
    return json(200, { data });
  } catch (e) {
    log("internal error", e);
    return json(500, { error: "internal_error", detail: `${e}` });
  }
};

serve(handler);
