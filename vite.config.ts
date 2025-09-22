import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { componentTagger } from "lovable-tagger";
import { brotliCompress, gzip } from "node:zlib";
import { promisify } from "node:util";
import type { NormalizedOutputOptions, OutputBundle, PluginContext } from "rollup";
import path from "path";

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

function spaFallbackPlugin(): Plugin {
  return {
    name: "spa-fallback-plugin",
    async generateBundle(
      this: PluginContext,
      _options: NormalizedOutputOptions,
      bundle: OutputBundle,
    ) {
      const indexHtml = bundle['index.html'];
      if (indexHtml && indexHtml.type === 'asset') {
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
    mode === 'development' && componentTagger(),
    mode !== 'development' && spaFallbackPlugin(),
    mode !== 'development' && compressPlugin(),
  ];

  if (process.env.ANALYZE) {
    const { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(visualizer({ open: true }) as Plugin);
  }

  return {
    base: '/',
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins.filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@lib': path.resolve(__dirname, './src/lib'),
      },
    },
    esbuild: {
      target: 'ES2022',
      tsconfig: './tsconfig.vite.json'
    },
    define: {
      global: 'globalThis',
      'process.env': {},
    },
    build: {
      target: 'ES2022',
      outDir: 'dist',
      sourcemap: false,
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
