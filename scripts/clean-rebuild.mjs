#!/usr/bin/env node

/**
 * Complete cache cleanup and rebuild script
 * Fixes SSR prerender cache issues
 */

import { existsSync, rmSync } from "fs";
import { spawn } from "child_process";

const cacheDirs = [
  "dist",
  "node_modules/.cache",
  ".tsbuildinfo",
  "node_modules/.vite",
  ".vite",
];

console.log("🧹 Limpando caches completos...\n");

// Phase 1: Clean all caches
cacheDirs.forEach((dir) => {
  if (existsSync(dir)) {
    try {
      rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Removido: ${dir}`);
    } catch (error) {
      console.log(`⚠️  Erro ao remover ${dir}:`, error.message);
    }
  } else {
    console.log(`ℹ️  Não encontrado: ${dir}`);
  }
});

console.log("\n🔨 Iniciando rebuild completo...\n");

// Phase 2: Run build
const buildProcess = spawn("npm", ["run", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

buildProcess.on("close", (code) => {
  if (code === 0) {
    console.log("\n✨ Rebuild completo com sucesso!");
    console.log("📁 Verifique dist/ e teste com: npm run preview");
  } else {
    console.log(`\n❌ Build falhou com código ${code}`);
    process.exit(1);
  }
});
