#!/usr/bin/env node

/**
 * Script para limpar console.logs de produção
 * Remove console.log mas mantém console.error, console.warn para debugging crítico
 */

import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

// Arquivos e diretórios a ignorar
const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/scripts/**",
  "**/src/lib/dev-diagnostics.ts", // Mantém para debugging
  "**/src/lib/debug-mode.ts", // Sistema de debug controlado
];

// Padrões a remover (console.log, console.info, console.debug)
const PATTERNS_TO_REMOVE = [
  /console\.log\([^)]*\);?\s*\n?/g,
  /console\.info\([^)]*\);?\s*\n?/g,
  /console\.debug\([^)]*\);?\s*\n?/g,
];

// Padrões a MANTER (console.error, console.warn, logger.*)
const PATTERNS_TO_KEEP = [/console\.error/, /console\.warn/, /logger\./];

async function cleanFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    let cleanedContent = content;
    let removedCount = 0;

    // Verifica se tem padrões para manter
    const hasKeepPatterns = PATTERNS_TO_KEEP.some((pattern) =>
      pattern.test(content),
    );

    // Remove console.logs
    PATTERNS_TO_REMOVE.forEach((pattern) => {
      const matches = cleanedContent.match(pattern);
      if (matches) {
        removedCount += matches.length;
        cleanedContent = cleanedContent.replace(pattern, "");
      }
    });

    // Remove linhas vazias em excesso
    cleanedContent = cleanedContent.replace(/\n{3,}/g, "\n\n");

    if (removedCount > 0) {
      if (VERBOSE) {
        console.log(`✓ ${filePath}: ${removedCount} console.logs removidos`);
      }

      if (!DRY_RUN) {
        writeFileSync(filePath, cleanedContent, "utf8");
      }

      return removedCount;
    }

    return 0;
  } catch (error) {
    console.error(`✗ Erro ao processar ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log("🧹 Limpando console.logs para produção...\n");

  if (DRY_RUN) {
    console.log("⚠️  Modo DRY RUN - nenhum arquivo será modificado\n");
  }

  // Busca arquivos TypeScript e JavaScript
  const files = await glob("src/**/*.{ts,tsx,js,jsx}", {
    ignore: IGNORE_PATTERNS,
  });

  console.log(`📁 ${files.length} arquivos encontrados\n`);

  let totalRemoved = 0;
  let filesModified = 0;

  for (const file of files) {
    const removed = await cleanFile(file);
    if (removed > 0) {
      totalRemoved += removed;
      filesModified++;
    }
  }

  console.log("\n📊 Resumo:");
  console.log(`   • Arquivos analisados: ${files.length}`);
  console.log(`   • Arquivos modificados: ${filesModified}`);
  console.log(`   • Console.logs removidos: ${totalRemoved}`);

  if (DRY_RUN) {
    console.log("\n⚠️  Execute sem --dry-run para aplicar as mudanças");
  } else {
    console.log("\n✅ Limpeza concluída com sucesso!");
  }
}

main().catch(console.error);
