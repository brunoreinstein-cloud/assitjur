#!/usr/bin/env node
import { execSync } from "node:child_process";

const [type, name] = process.argv.slice(2);

const configs = {
  feature: { base: "develop", prefix: "feature/" },
  release: { base: "develop", prefix: "release/" },
  hotfix: { base: "main", prefix: "hotfix/" },
};

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

if (!type || !name) {
  console.error("Usage: node tools/branch.js <feature|release|hotfix> <name>");
  process.exit(1);
}

const config = configs[type];

if (!config) {
  console.error(`Unknown branch type: ${type}`);
  process.exit(1);
}

const branchName = `${config.prefix}${name}`;

try {
  run("git fetch origin");

  try {
    run(`git rev-parse --verify ${config.base}`);
    run(`git checkout ${config.base}`);
  } catch {
    run(`git checkout -b ${config.base} origin/${config.base}`);
  }

  run(`git pull origin ${config.base}`);
  run(`git checkout -b ${branchName}`);
  run(`git push -u origin ${branchName}`);
  console.log(
    `Branch ${branchName} created from ${config.base} and pushed to origin.`,
  );
} catch (err) {
  console.error("Failed to create branch:", err.message);
  process.exit(1);
}
