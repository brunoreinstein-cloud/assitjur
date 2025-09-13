import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { componentTagger } from "lovable-tagger";
import { brotliCompress, gzip } from "node:zlib";
import { promisify } from "node:util";
import { VitePWA } from 'vite-plugin-pwa'

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

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [
    react(),
    tsconfigPaths(),
    mode === 'development' && componentTagger(),
    mode !== 'development' && compressPlugin(),
    VitePWA({
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', '404.html'],
      manifest: {
        name: 'Assistjur',
        short_name: 'Assistjur',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
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
    build: {
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
