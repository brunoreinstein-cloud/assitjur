#!/usr/bin/env bash
set -euo pipefail

echo "☢️  NUCLEAR CACHE CLEANUP - AssistJur.IA"
echo "=========================================="
echo ""

# 🔥 Fase 1: Matar TODOS os processos Node.js e tsx
echo "💀 Matando todos os processos Node.js e tsx..."
pkill -9 node 2>/dev/null || echo "  ℹ️  Nenhum processo node encontrado"
pkill -9 tsx 2>/dev/null || echo "  ℹ️  Nenhum processo tsx encontrado"
sleep 1

# 🔥 Fase 2: Remover TODOS os caches possíveis
echo ""
echo "🧹 Removendo TODOS os caches..."
rm -rf dist && echo "  ✅ dist/" || echo "  ℹ️  dist/ não encontrado"
rm -rf .vite && echo "  ✅ .vite/" || echo "  ℹ️  .vite/ não encontrado"
rm -rf node_modules/.vite && echo "  ✅ node_modules/.vite" || echo "  ℹ️  node_modules/.vite não encontrado"
rm -rf node_modules/.cache && echo "  ✅ node_modules/.cache" || echo "  ℹ️  node_modules/.cache não encontrado"
rm -rf node_modules/.pnpm && echo "  ✅ node_modules/.pnpm" || echo "  ℹ️  node_modules/.pnpm não encontrado"
rm -rf .tsbuildinfo && echo "  ✅ .tsbuildinfo" || echo "  ℹ️  .tsbuildinfo não encontrado"
rm -rf tsconfig.tsbuildinfo && echo "  ✅ tsconfig.tsbuildinfo" || echo "  ℹ️  tsconfig.tsbuildinfo não encontrado"
rm -rf ~/.tsx-cache 2>/dev/null && echo "  ✅ ~/.tsx-cache" || echo "  ℹ️  ~/.tsx-cache não encontrado"

# 🔥 Fase 3: Limpar cache do Node.js
echo ""
echo "🗑️  Limpando cache do npm..."
npm cache clean --force 2>/dev/null || echo "  ⚠️  Falha ao limpar cache npm"

# 🔥 Fase 4: Build com flags de no-cache
echo ""
echo "🔨 Executando build LIMPO (sem cache)..."
NODE_OPTIONS="--no-compilation-cache" npm run build

# 🔥 Fase 5: Validar bundle
echo ""
echo "🔍 Validando bundle..."
if [ -f "dist/index.html" ]; then
  echo "  ✅ dist/index.html gerado com sucesso"
  echo "  📦 Tamanho: $(ls -lh dist/index.html | awk '{print $5}')"
else
  echo "  ❌ ERRO: dist/index.html não foi gerado!"
  exit 1
fi

echo ""
echo "🎉 NUCLEAR REBUILD CONCLUÍDO!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Teste localmente: npm run preview"
echo "  2. Verifique se o erro desapareceu"
echo "  3. Se necessário, execute: git status para ver mudanças"
