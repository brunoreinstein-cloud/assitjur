#!/usr/bin/env bash
# Usage: DOMAIN=https://assistjur.com.br scripts/check-seo.sh

set -euo pipefail
DOMAIN="${DOMAIN:-https://assistjur.com.br}"

echo "Robots.txt"
if curl -fsSL "$DOMAIN/robots.txt" -o /tmp/robots.txt; then
  echo "  OK"
  grep -i "sitemap" /tmp/robots.txt || echo "  Sitemap not declared"
else
  echo "  missing"
fi

echo "sitemap.xml"
if curl -fsSL "$DOMAIN/sitemap.xml" -o /tmp/sitemap.xml; then
  echo "  OK"
else
  echo "  missing"
fi

for path in "/" "/mapa"; do
  echo "Checking canonical on $path"
  if curl -fsSL "$DOMAIN$path" | grep -iq 'rel="canonical"'; then
    echo "  canonical OK"
  else
    echo "  canonical missing"
  fi
  if curl -fsSL "$DOMAIN$path" | egrep -iq 'og:title|og:image|twitter:card|twitter:image'; then
    echo "  OG/Twitter OK"
  else
    echo "  OG/Twitter missing"
  fi
done
