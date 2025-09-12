import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { componentTagger } from "lovable-tagger";
import { brotliCompressSync, gzipSync } from "zlib";

function compressPlugin() {
  return {
    name: "compress-assets",
    generateBundle(_options, bundle) {
      for (const [fileName, asset] of Object.entries(bundle)) {
        const source = (asset as any).code || (asset as any).source;
        if (!source) continue;
        const buffer = Buffer.isBuffer(source) ? source : Buffer.from(source);
        this.emitFile({ type: "asset", fileName: `${fileName}.gz`, source: gzipSync(buffer) });
        this.emitFile({ type: "asset", fileName: `${fileName}.br`, source: brotliCompressSync(buffer) });
      }
    },
  } as any;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : undefined,
  plugins: [
    react(),
    tsconfigPaths(),
    mode === "development" && componentTagger(),
    mode === "production" && compressPlugin(),
  ].filter(Boolean),
}));
