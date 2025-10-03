#!/usr/bin/env node

/**
 * Quick fix script - bypasses package.json issues
 * Direct build without dependency validation
 */

import { spawn } from "child_process";
import { existsSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from "fs";

const runCommand = (command, args = []) => {
  return new Promise((resolve) => {
    console.log(`🔧 ${command} ${args.join(" ")}`);

    const proc = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    proc.on("close", (code) => {
      console.log(code === 0 ? `✅ Success` : `⚠️  Exit code: ${code}`);
      resolve(code === 0);
    });
  });
};

async function quickBuild() {
  console.log("⚡ Quick Build (bypassing package.json validation)...\n");

  try {
    // Clean dist
    if (existsSync("dist")) {
      rmSync("dist", { recursive: true, force: true });
      console.log("🧹 Cleaned dist/");
    }

    // Direct vite build (skip dependency checks)
    console.log("🏗️  Direct Vite build...");
    const success = await runCommand("npx", [
      "vite",
      "build",
      "--mode",
      "production",
    ]);

    if (success) {
      // Ensure SPA fallback
      if (existsSync("dist/index.html")) {
        copyFileSync("dist/index.html", "dist/404.html");
        console.log("✅ Created 404.html");
      }

      console.log("\n🎉 Quick build completed!");
      console.log("📁 Check dist/ directory");
    } else {
      console.log("\n❌ Quick build failed");
    }
  } catch (error) {
    console.error("💥 Error:", error.message);
  }
}

quickBuild();
