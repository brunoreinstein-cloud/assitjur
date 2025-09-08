#!/usr/bin/env bash
set -euo pipefail

: "${FUNCTION_URL:?FUNCTION_URL is required}"
: "${ANON_KEY:?ANON_KEY is required}"
: "${JWT:?JWT is required}"

status=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -H "apikey: $ANON_KEY" \
  -d '{"page":1,"limit":1}')

if [ "$status" -ne 200 ]; then
  echo "Request failed with status $status"
  exit 1
fi

echo "Edge function responded with status $status"
