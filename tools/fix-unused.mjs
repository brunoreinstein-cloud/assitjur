import ts from "typescript";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const logPath = process.argv[2];
let targetFiles = null;
if (logPath) {
  const logContent = readFileSync(logPath, "utf8");
  targetFiles = new Set(
    Array.from(
      logContent.matchAll(/([^:(\n]+)\(\d+,\d+\): error TS6133/g),
      (match) => path.resolve(match[1]),
    ),
  );
}

const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
if (!configPath) {
  throw new Error("Could not find tsconfig.json");
}

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
if (configFile.error) {
  throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
}

const parsed = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(configPath),
);

const files = new Map();
for (const fileName of parsed.fileNames) {
  const content = ts.sys.readFile(fileName);
  if (content !== undefined) {
    files.set(fileName, { version: 0, content });
  }
}

const servicesHost = {
  getScriptFileNames: () => Array.from(files.keys()),
  getScriptVersion: (fileName) => {
    const file = files.get(fileName);
    return file ? String(file.version) : "0";
  },
  getScriptSnapshot: (fileName) => {
    const file = files.get(fileName);
    if (!file) {
      const content = ts.sys.readFile(fileName);
      if (content === undefined) return undefined;
      files.set(fileName, { version: 0, content });
      return ts.ScriptSnapshot.fromString(content);
    }
    return ts.ScriptSnapshot.fromString(file.content);
  },
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};

const service = ts.createLanguageService(
  servicesHost,
  ts.createDocumentRegistry(),
);

const updated = new Set();

for (const fileName of parsed.fileNames) {
  if (targetFiles && !targetFiles.has(path.resolve(fileName))) continue;
  const skipped = new Set();
  let iterations = 0;
  while (iterations < 200) {
    iterations += 1;
    const diagnostics = service
      .getSemanticDiagnostics(fileName)
      .filter((diag) => diag.code === 6133 && !skipped.has(diag.start));
    if (diagnostics.length === 0) break;

    const diag = diagnostics[0];
    console.log(`Fixing ${fileName} at ${diag.start}`);

    let fixes;
    try {
      fixes = service.getCodeFixesAtPosition(
        fileName,
        diag.start ?? 0,
        (diag.start ?? 0) + (diag.length ?? 0),
        [6133],
        {},
        {},
      );
    } catch (error) {
      console.warn(`Skipping diagnostic at ${fileName}:${diag.start} due to ${error}`);
      skipped.add(diag.start);
      continue;
    }

    if (!fixes.length) {
      skipped.add(diag.start);
      continue;
    }

    const fix = fixes[0];
    let applied = false;
    for (const change of fix.changes) {
      const fileEntry = files.get(change.fileName);
      if (!fileEntry) continue;
      fileEntry.content = ts.textChanges.applyChanges(
        fileEntry.content,
        change.textChanges,
      );
      fileEntry.version += 1;
      files.set(change.fileName, fileEntry);
      updated.add(change.fileName);
      applied = true;
    }

    if (!applied) {
      skipped.add(diag.start);
      continue;
    }
  }
}

for (const fileName of updated) {
  writeFileSync(fileName, files.get(fileName).content);
}

