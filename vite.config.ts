import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { componentTagger } from "lovable-tagger";
import { brotliCompress, gzip } from "node:zlib";
import { promisify } from "node:util";
import type { NormalizedOutputOptions, OutputBundle, PluginContext } from "rollup";

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

function compressPlugin(): Plugin {
  return {
    name: "compress-plugin",
    async generateBundle(
      this: PluginContext,
      _options: NormalizedOutputOptions,
      bundle: OutputBundle,
    ) {
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

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [
    react(),
    tsconfigPaths(),
    mode === 'development' && componentTagger(),
    mode !== 'development' && compressPlugin(),
  ];

  if (process.env.ANALYZE) {
    const { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(visualizer({ open: true }) as Plugin);
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins.filter(Boolean),
    define: {
      global: 'globalThis',
    },
    build: {
      target: 'ES2022',
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('lucide-react')) {
                return 'vendor';
              }
            }
            if (id.includes('/src/pages/')) {
              const name = id.split('/src/pages/')[1].split('/')[0].split('.')[0];
              return `page-${name}`;
            }
          },
        },
      },
    },
  };
});
