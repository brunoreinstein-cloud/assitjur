#!/usr/bin/env bash
set -euo pipefail

report=$(mktemp)
# Run Supabase query to list views that are not security invoker
supabase db exec < supabase/queries/security_invoker_report.sql > "$report"

if grep -q "security_invoker|false" "$report"; then
  echo "❌ Views sem security_invoker=true detectadas."
  cat "$report"
  exit 1
fi

echo "✅ Todas as views usam security_invoker=true."
