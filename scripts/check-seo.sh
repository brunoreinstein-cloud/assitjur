#!/usr/bin/env bash
# Usage: DOMAIN=https://assistjur.com.br scripts/check-seo.sh

set -e
DOMAIN=${DOMAIN:-https://assistjur.com.br}

echo "Robots.txt"
curl -s -o /tmp/robots.txt -w "%{http_code}\n" "$DOMAIN/robots.txt" | grep 200 >/dev/null && echo "  OK" || echo "  missing"
grep -i "sitemap" /tmp/robots.txt || echo "  Sitemap not declared"

echo "sitemap.xml"
curl -s -o /tmp/sitemap.xml -w "%{http_code}\n" "$DOMAIN/sitemap.xml" | grep 200 >/dev/null && echo "  OK" || echo "  missing"

for path in "/" "/mapa"; do
  echo "Checking canonical on $path"
  curl -s "$DOMAIN$path" | grep -i 'rel="canonical"' >/dev/null && echo "  canonical OK" || echo "  canonical missing"
  curl -s "$DOMAIN$path" | egrep -i 'og:title|og:image|twitter:card|twitter:image' >/dev/null && echo "  OG/Twitter OK" || echo "  OG/Twitter missing"
done
