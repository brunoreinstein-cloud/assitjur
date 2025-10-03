#!/usr/bin/env node

/**
 * Script de validação pré-deploy
 * Verifica se o projeto está pronto para produção
 */

import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { glob } from "glob";

const CHECKS = {
  passed: [],
  warnings: [],
  errors: [],
};

function logCheck(type, message) {
  const icons = { passed: "✅", warning: "⚠️ ", error: "❌" };
  console.log(`${icons[type]} ${message}`);
  CHECKS[
    type === "error" ? "errors" : type === "warning" ? "warnings" : "passed"
  ].push(message);
}

// ============================================
// CHECK 1: Environment Variables
// ============================================
async function checkEnvironmentVariables() {
  console.log("\n📋 Verificando variáveis de ambiente...\n");

  const requiredVars = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_PUBLIC_SITE_URL",
  ];

  const envFile = ".env.production";

  if (!existsSync(envFile)) {
    logCheck("error", `Arquivo ${envFile} não encontrado`);
    logCheck("warning", "Crie a partir de .env.production.example");
    return;
  }

  const envContent = readFileSync(envFile, "utf8");

  requiredVars.forEach((varName) => {
    const regex = new RegExp(`${varName}=.+`);
    if (regex.test(envContent)) {
      logCheck("passed", `${varName} configurado`);
    } else {
      logCheck("error", `${varName} não encontrado ou vazio`);
    }
  });
}

// ============================================
// CHECK 2: Console.logs in Production Code
// ============================================
async function checkConsoleLogs() {
  console.log("\n🔍 Verificando console.logs em código de produção...\n");

  const files = await glob("src/**/*.{ts,tsx}", {
    ignore: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/src/lib/dev-diagnostics.ts",
      "**/src/lib/debug-mode.ts",
    ],
  });

  let totalLogs = 0;
  const filesWithLogs = [];

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const matches = content.match(/console\.(log|info|debug)\(/g);
    if (matches) {
      totalLogs += matches.length;
      filesWithLogs.push({ file, count: matches.length });
    }
  }

  if (totalLogs === 0) {
    logCheck("passed", "Nenhum console.log encontrado em código de produção");
  } else {
    logCheck(
      "warning",
      `${totalLogs} console.logs encontrados em ${filesWithLogs.length} arquivos`,
    );
    logCheck("warning", "Execute: node scripts/clean-console-logs.js");

    if (filesWithLogs.length <= 5) {
      filesWithLogs.forEach(({ file, count }) => {
        console.log(`     • ${file} (${count})`);
      });
    }
  }
}

// ============================================
// CHECK 3: TypeScript Compilation
// ============================================
async function checkTypeScript() {
  console.log("\n🔧 Verificando TypeScript...\n");

  try {
    execSync("npx tsc --noEmit", { stdio: "pipe" });
    logCheck("passed", "Type check passou sem erros");
  } catch (error) {
    logCheck("error", "Type check falhou");
    logCheck("warning", "Execute: npm run typecheck para ver os erros");
  }
}

// ============================================
// CHECK 4: Build Test
// ============================================
async function checkBuild() {
  console.log("\n🏗️  Testando build de produção...\n");

  try {
    execSync("npm run build", { stdio: "pipe" });
    logCheck("passed", "Build de produção compilou com sucesso");
  } catch (error) {
    logCheck("error", "Build de produção falhou");
    logCheck("warning", "Execute: npm run build para ver os erros");
  }
}

// ============================================
// CHECK 5: Security Configuration
// ============================================
async function checkSecurity() {
  console.log("\n🔒 Verificando configuração de segurança...\n");

  // Check ProductionOptimizer
  const appFile = "src/App.tsx";
  if (existsSync(appFile)) {
    const content = readFileSync(appFile, "utf8");
    if (content.includes("ProductionOptimizer")) {
      logCheck("passed", "ProductionOptimizer está ativo");
    } else {
      logCheck("warning", "ProductionOptimizer não encontrado em App.tsx");
    }
  }

  // Check if sensitive data is not in code
  const getEnvFile = "src/lib/getEnv.ts";
  if (existsSync(getEnvFile)) {
    const content = readFileSync(getEnvFile, "utf8");
    if (!content.includes("eyJ") && !content.includes("sk-")) {
      logCheck("passed", "Nenhuma credencial hardcoded detectada");
    } else {
      logCheck("error", "Possível credencial hardcoded em getEnv.ts");
    }
  }
}

// ============================================
// CHECK 6: Edge Functions Configuration
// ============================================
async function checkEdgeFunctions() {
  console.log("\n⚡ Verificando Edge Functions...\n");

  const configFile = "supabase/config.toml";
  if (existsSync(configFile)) {
    logCheck("passed", "supabase/config.toml encontrado");

    const content = readFileSync(configFile, "utf8");
    const functionMatches = content.match(/\[functions\./g);
    if (functionMatches) {
      logCheck(
        "passed",
        `${functionMatches.length} Edge Functions configuradas`,
      );
    }
  } else {
    logCheck("warning", "supabase/config.toml não encontrado");
  }

  console.log("\n   ⚠️  Lembrete: Configure secrets no Supabase Dashboard:");
  console.log("      • OPENAI_API_KEY");
  console.log("      • OPENAI_ORG (opcional)");
  console.log("      • OPENAI_PROJECT (opcional)");
}

// ============================================
// Main Execution
// ============================================
async function main() {
  console.log("🚀 AssistJur.IA - Verificação Pré-Deploy\n");
  console.log("=".repeat(50));

  await checkEnvironmentVariables();
  await checkConsoleLogs();
  await checkTypeScript();
  await checkBuild();
  await checkSecurity();
  await checkEdgeFunctions();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 RESUMO DA VERIFICAÇÃO:\n");
  console.log(`✅ Passou: ${CHECKS.passed.length}`);
  console.log(`⚠️  Avisos: ${CHECKS.warnings.length}`);
  console.log(`❌ Erros: ${CHECKS.errors.length}`);

  if (CHECKS.errors.length === 0 && CHECKS.warnings.length === 0) {
    console.log("\n🎉 PROJETO PRONTO PARA DEPLOY!\n");
    process.exit(0);
  } else if (CHECKS.errors.length === 0) {
    console.log("\n⚠️  PROJETO PRONTO COM AVISOS - Revisar antes do deploy\n");
    process.exit(0);
  } else {
    console.log(
      "\n❌ PROJETO NÃO ESTÁ PRONTO - Corrija os erros antes do deploy\n",
    );
    process.exit(1);
  }
}

main().catch(console.error);
