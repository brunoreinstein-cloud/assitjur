import { access, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");
const indexPath = resolve(distDir, "index.html");
const fallback200Path = resolve(distDir, "200.html");

async function ensureFileExists(path) {
  try {
    await access(path);
  } catch {
    throw new Error(`Arquivo não encontrado: ${path}`);
  }
}

async function copySpaFallback() {
  await ensureFileExists(indexPath);
  await copyFile(indexPath, fallback200Path);
  console.log(`[spa-fallback] Copiado ${indexPath} → ${fallback200Path}`);
}

copySpaFallback().catch((error) => {
  console.error("[spa-fallback] Falha ao gerar 200.html");
  console.error(error);
  process.exitCode = 1;
});
