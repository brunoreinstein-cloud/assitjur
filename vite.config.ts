import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { componentTagger } from "lovable-tagger";
import { brotliCompress, gzip } from "node:zlib";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

function compressPlugin() {
  return {
    name: "compress-plugin",
    async generateBundle(_options: any, bundle: any) {
      for (const fileName of Object.keys(bundle)) {
        if (!/\.(js|css|html|svg|json)$/i.test(fileName)) continue;
        const asset = bundle[fileName];
        const source =
          asset.type === "asset"
            ? typeof asset.source === "string"
              ? Buffer.from(asset.source)
              : asset.source
            : Buffer.from(asset.code);
        const gz = await gzipAsync(source);
        (this as any).emitFile({
          type: "asset",
          fileName: `${fileName}.gz`,
          source: gz,
        });
        const br = await brotliAsync(source);
        (this as any).emitFile({
          type: "asset",
          fileName: `${fileName}.br`,
          source: br,
        });
      }
    },
  };
}

function staticPagesPlugin() {
  return {
    name: "static-pages",
    apply: "build",
    async closeBundle() {
      const distDir = path.resolve("dist");
      const indexPath = path.join(distDir, "index.html");
      const indexHtml = await readFile(indexPath, "utf8");
      const templatesDir = path.resolve("src/pages-static");
      let files: string[] = [];
      try {
        files = await readdir(templatesDir);
      } catch {
        return;
      }
      for (const file of files) {
        if (!file.endsWith(".html")) continue;
        const slug = file.replace(/\.html$/, "");
        const content = await readFile(path.join(templatesDir, file), "utf8");
        const html = indexHtml.replace(
          "<div id=\"root\"></div>",
          `<div id=\"root\">${content}</div>`
        );
        const outDir = path.join(distDir, slug);
        await mkdir(outDir, { recursive: true });
        await writeFile(path.join(outDir, "index.html"), html);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [
    react(),
    tsconfigPaths(),
    mode === 'development' && componentTagger(),
    mode !== 'development' && compressPlugin(),
    staticPagesPlugin(),
  ];

  if (process.env.ANALYZE) {
    const { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(visualizer({ open: true }) as any);
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins.filter(Boolean),
  };
});
