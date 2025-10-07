#!/bin/bash

echo "🧹 Limpando caches completos..."

rm -rf dist
rm -rf node_modules/.cache
rm -rf .tsbuildinfo
rm -rf node_modules/.vite
rm -rf .vite

echo "✅ Caches removidos!"
echo ""
echo "🔨 Execute agora: npm run build"
