#!/usr/bin/env bash
set -euo pipefail

# Create a view without security_invoker flag
definer_sql="CREATE OR REPLACE VIEW public.security_definer_test AS SELECT 1 AS col;"
supabase db exec <<<"$definer_sql" >/dev/null

# Run audit expecting failure
if scripts/audit-security-invoker.sh; then
  echo "Teste falhou: script deveria detectar a view sem security_invoker=true." >&2
  supabase db exec <<<"DROP VIEW IF EXISTS public.security_definer_test;" >/dev/null
  exit 1
fi

# Cleanup
supabase db exec <<<"DROP VIEW IF EXISTS public.security_definer_test;" >/dev/null
