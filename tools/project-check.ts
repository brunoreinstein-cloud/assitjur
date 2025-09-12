import fs from "fs";
import path from "path";

interface Check {
  label: string;
  check: () => boolean;
}

const root = process.cwd();

const files: Check[] = [
  {
    label: ".husky directory",
    check: () => fs.existsSync(path.join(root, ".husky")),
  },
  {
    label: ".lintstagedrc.js",
    check: () => fs.existsSync(path.join(root, ".lintstagedrc.js")),
  },
  {
    label: "commitlint.config.cjs",
    check: () => fs.existsSync(path.join(root, "commitlint.config.cjs")),
  },
  {
    label: ".github/workflows/ci-cd.yml",
    check: () => fs.existsSync(path.join(root, ".github/workflows/ci-cd.yml")),
  },
  {
    label: ".env.example",
    check: () => fs.existsSync(path.join(root, ".env.example")),
  },
];

const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const scripts = pkg.scripts ?? {};
const requiredScripts = [
  "build",
  "test",
  "lint",
  "format",
  "type-check",
  "release",
];

const scriptChecks: Check[] = requiredScripts.map((name) => ({
  label: `package.json scripts.${name}`,
  check: () => typeof scripts[name] === "string",
}));

const checks = [...files, ...scriptChecks];

let hasFail = false;
for (const c of checks) {
  const result = c.check();
  console.log(`${c.label}: ${result ? "OK" : "FAIL"}`);
  if (!result) hasFail = true;
}

if (hasFail) process.exit(1);
