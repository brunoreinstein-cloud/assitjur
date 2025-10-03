import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { componentTagger } from "lovable-tagger";
import { brotliCompress, gzip } from "node:zlib";
import { promisify } from "node:util";
const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);
function compressPlugin() {
  return {
    name: "compress-plugin",
    async generateBundle(_options, bundle) {
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
        this.emitFile({
          type: "asset",
          fileName: `${fileName}.gz`,
          source: gz,
        });
        const br = await brotliAsync(source);
        this.emitFile({
          type: "asset",
          fileName: `${fileName}.br`,
          source: br,
        });
      }
    },
  };
}
function spaFallbackPlugin() {
  return {
    name: "spa-fallback-plugin",
    async generateBundle(_options, bundle) {
      const indexHtml = bundle["index.html"];
      if (indexHtml && indexHtml.type === "asset") {
        this.emitFile({
          type: "asset",
          fileName: "404.html",
          source: indexHtml.source,
        });
      }
    },
  };
}
// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [
    react(),
    tsconfigPaths(),
    mode === "development" && componentTagger(),
    mode !== "development" && spaFallbackPlugin(),
    mode !== "development" && compressPlugin(),
  ];
  if (process.env.ANALYZE) {
    const { visualizer } = await import("rollup-plugin-visualizer");
    plugins.push(visualizer({ open: true }));
  }
  return {
    base: "/",
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins.filter(Boolean),
    define: {
      global: "globalThis",
    },
    build: {
      target: "ES2022",
      outDir: "dist",
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("lucide-react")) {
                return "vendor";
              }
            }
            if (id.includes("/src/pages/")) {
              const name = id
                .split("/src/pages/")[1]
                .split("/")[0]
                .split(".")[0];
              return `page-${name}`;
            }
          },
        },
      },
    },
  };
});
