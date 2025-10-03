import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import Papa from "papaparse";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run(format = "json") {
  const { data, error } = await supabase.from("lgpd_consent").select("*");
  if (error) throw error;
  if (format === "csv") {
    const csv = Papa.unparse(data || []);
    fs.writeFileSync("lgpd_consent.csv", csv);
    console.log("exported lgpd_consent.csv");
  } else {
    fs.writeFileSync("lgpd_consent.json", JSON.stringify(data, null, 2));
    console.log("exported lgpd_consent.json");
  }
}

const fmt = process.argv[2] === "csv" ? "csv" : "json";
run(fmt).catch((e) => {
  console.error("export error", e);
  process.exit(1);
});
