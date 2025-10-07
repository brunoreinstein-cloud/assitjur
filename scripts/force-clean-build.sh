#!/usr/bin/env bash
set -euo pipefail

echo "🧹 LIMPEZA AGRESSIVA DE CACHE - AssistJur.IA"
echo "=============================================="
echo ""

# Fase 1: Remover todos os caches
echo "📁 Removendo caches..."
rm -rf node_modules/.vite && echo "  ✅ node_modules/.vite" || echo "  ℹ️  node_modules/.vite não encontrado"
rm -rf node_modules/.cache && echo "  ✅ node_modules/.cache" || echo "  ℹ️  node_modules/.cache não encontrado"
rm -rf node_modules/.pnpm && echo "  ✅ node_modules/.pnpm" || echo "  ℹ️  node_modules/.pnpm não encontrado"
rm -rf dist && echo "  ✅ dist/" || echo "  ℹ️  dist/ não encontrado"
rm -rf .vite && echo "  ✅ .vite/" || echo "  ℹ️  .vite/ não encontrado"
rm -rf .tsbuildinfo && echo "  ✅ .tsbuildinfo" || echo "  ℹ️  .tsbuildinfo não encontrado"

echo ""
echo "📦 Reinstalando dependências com --force..."
npm install --force

echo ""
echo "🔨 Executando build limpo..."
npm run build

echo ""
echo "🔍 Validando bundle (verificando erros antigos)..."
if grep -r "useConsent must be used within" dist/ 2>/dev/null; then
  echo "❌ ERRO: Cache ainda presente no bundle!"
  exit 1
else
  echo "✅ Bundle limpo - nenhum erro antigo detectado"
fi

echo ""
echo "🎉 BUILD LIMPO CONCLUÍDO COM SUCESSO!"
echo "📁 Arquivos gerados em dist/"
ls -lh dist/index.html 2>/dev/null || echo "⚠️  index.html não encontrado"
