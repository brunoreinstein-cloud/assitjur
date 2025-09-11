import fs from "fs";
import path from "path";

const HANDS =
  /[\u{1F446}-\u{1F449}\u{261A}-\u{261F}](?:\uFE0F)?(?:[\u{1F3FB}-\u{1F3FF}])?/gu;

const TEXT_EXTENSIONS = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "css",
  "scss",
  "md",
  "mdx",
  "json",
  "yml",
  "yaml",
  "html",
  "txt",
];

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".git",
  "coverage",
  "pnpm-store",
]);

function isLockFile(file: string) {
  return file.includes("lock");
}

function shouldProcess(file: string) {
  if (isLockFile(path.basename(file))) return false;
  const ext = path.extname(file).slice(1);
  if (ext === "") return false;
  if (TEXT_EXTENSIONS.includes(ext)) return true;
  if (
    file.endsWith(".env") ||
    file.endsWith(".env.example") ||
    file.includes(".env.")
  )
    return true;
  return false;
}

async function walk(dir: string, files: string[] = []): Promise<string[]> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else {
      if (shouldProcess(fullPath)) files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  const files = await walk(".");
  let totalFiles = 0;
  let totalOccurrences = 0;
  const examples: { file: string; before: string; after: string }[] = [];

  for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    const matches = [...original.matchAll(HANDS)];
    if (matches.length === 0) continue;

    let modified = original.replace(HANDS, "");
    modified = modified.replace(/[ \t]{2,}/g, " ");
    modified = modified.replace(/[ \t]+([,.;:!?])/g, "$1");

    if (modified !== original) {
      fs.writeFileSync(file, modified);
      totalFiles++;
      totalOccurrences += matches.length;

      const beforeLines = original.split(/\r?\n/);
      const afterLines = modified.split(/\r?\n/);
      for (const m of matches) {
        if (examples.length >= 3) break;
        const idx = m.index ?? 0;
        const lineNum = original.slice(0, idx).split(/\r?\n/).length - 1;
        examples.push({
          file,
          before: beforeLines[lineNum],
          after: afterLines[lineNum],
        });
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        filesChanged: totalFiles,
        occurrencesRemoved: totalOccurrences,
        examples,
      },
      null,
      2,
    ),
  );
}

main();
