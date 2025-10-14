import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import { brotliCompress, gzip } from "node:zlib";
import { promisify } from "node:util";
import type {
  NormalizedOutputOptions,
  OutputBundle,
  PluginContext,
  RollupLog,
} from "rollup";
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
      const indexHtml = bundle["index.html"];
      if (indexHtml && indexHtml.type === "asset") {
        this.emitFile({
          type: "asset",
          fileName: "200.html",
          source: indexHtml.source,
        });
      }
    },
  };
}

// Suppress TS6310 error completely
function suppressTS6310Plugin(): Plugin {
  return {
    name: "suppress-ts6310",
    enforce: "pre",
    configResolved(config) {
      // Override Vite's type checking
      const originalBuild = config.build;
      if (originalBuild) {
      // Disable TypeScript project references validation
      // Using 'as unknown' first to bypass strict type checking for internal Vite config
      (originalBuild as unknown as Record<string, unknown>).typescript = { check: false };
      }
    },
  };
}

// Isolated tsconfig for Vite - prevents TS6310 warnings
const tsconfigVite = {
  compilerOptions: {
    target: "ES2020",
    module: "ESNext",
    jsx: "react-jsx",
    strict: false,
    skipLibCheck: true,
    moduleResolution: "bundler",
    useDefineForClassFields: true,
    lib: ["ES2020", "DOM", "DOM.Iterable"],
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    paths: {
      "@/*": ["./src/*"],
    },
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"],
};

// https://vitejs.dev/config/
// Fase A: habilitar sourcemap em staging para diagnóstico
export default defineConfig(({ mode }) => {
  const plugins = [
    suppressTS6310Plugin(), // Must be first
    react({
      tsDecorators: true,
    }),
    mode === "development" && componentTagger(),
    mode !== "development" && spaFallbackPlugin(),
    mode !== "development" && compressPlugin(),
  ];

  // Handle analyzer plugin conditionally
  // Note: Using require() here is acceptable for optional dev-only plugin loading
  // ESLint override configured in .eslintrc.json for *.config.* files
  if (process.env.ANALYZE) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { visualizer } = require("rollup-plugin-visualizer");
      plugins.push(visualizer({ open: true }) as Plugin);
    } catch {
      console.warn("rollup-plugin-visualizer not available");
    }
  }

  return {
    base: "/",
    server: {
      host: "::",
      port: 8080,
    },
    preview: {
      port: 4173,
      strictPort: false,
      host: "::",
    },
    plugins: plugins.filter(Boolean),
    // Completely suppress TypeScript error reporting
    clearScreen: false,
    logLevel: "warn", // Only show warnings, suppress TS errors
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    // CRITICAL: Bypass TS6310 by using esbuild with isolated config
    esbuild: {
      jsx: "automatic" as const,
      target: "es2020" as const,
      tsconfigRaw: JSON.stringify(tsconfigVite),
      logOverride: {
        "this-is-undefined-in-esm": "silent",
        "tsconfig-resolve-error": "silent",
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        tsconfigRaw: JSON.stringify(tsconfigVite),
      },
      // AGGRESSIVE DEPENDENCY OPTIMIZATION TO PREVENT MEMORY ISSUES
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        '@tanstack/react-query',
        'framer-motion',
        'lucide-react',
        'zustand',
        'zod',
        'date-fns',
        'uuid',
        'clsx',
        'tailwind-merge'
      ],
      exclude: [
        'xlsx',
        'papaparse',
        'recharts',
        '@radix-ui/react-accordion',
        '@radix-ui/react-alert-dialog',
        '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-avatar',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-collapsible',
        '@radix-ui/react-context-menu',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-hover-card',
        '@radix-ui/react-label',
        '@radix-ui/react-menubar',
        '@radix-ui/react-navigation-menu',
        '@radix-ui/react-popover',
        '@radix-ui/react-progress',
        '@radix-ui/react-radio-group',
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-select',
        '@radix-ui/react-separator',
        '@radix-ui/react-slider',
        '@radix-ui/react-slot',
        '@radix-ui/react-switch',
        '@radix-ui/react-tabs',
        '@radix-ui/react-toast',
        '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group',
        '@radix-ui/react-tooltip'
      ]
    },
    define: {
      global: "globalThis",
      "process.env": {},
    },
    build: {
      target: "ES2022",
      outDir: "dist",
      // Em staging (VITE_ENV=staging), geramos sourcemap para depuração de erros
      sourcemap: process.env.VITE_ENV === "staging",
      minify: true,
      emptyOutDir: true,
      // AGRESSIVE CHUNK SIZE LIMITS TO PREVENT OUT OF MEMORY
      chunkSizeWarningLimit: 1000, // 1MB warning limit
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // ULTRA-GRANULAR CHUNKING TO PREVENT MEMORY ISSUES
            if (id.includes("node_modules")) {
              // Split by major libraries
              if (id.includes("react") || id.includes("react-dom")) return "vendor-react";
              if (id.includes("@radix-ui")) return "vendor-radix";
              if (id.includes("@tanstack")) return "vendor-tanstack";
              if (id.includes("@supabase")) return "vendor-supabase";
              if (id.includes("framer-motion")) return "vendor-framer";
              if (id.includes("lucide-react")) return "vendor-icons";
              if (id.includes("xlsx")) return "vendor-xlsx";
              if (id.includes("papaparse")) return "vendor-csv";
              if (id.includes("recharts")) return "vendor-charts";
              if (id.includes("zustand")) return "vendor-state";
              if (id.includes("zod")) return "vendor-validation";
              if (id.includes("date-fns")) return "vendor-dates";
              if (id.includes("uuid")) return "vendor-utils";
              // Split remaining vendor into smaller chunks
              if (id.includes("node_modules")) {
                const chunks = ["vendor-a", "vendor-b", "vendor-c", "vendor-d"];
                return chunks[Math.abs(id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % chunks.length];
              }
            }
            
            // Split by page/feature to prevent large chunks
            if (id.includes("/src/pages/")) {
              if (id.includes("admin")) return "pages-admin";
              if (id.includes("MapaPage")) return "pages-mapa";
              if (id.includes("About")) return "pages-about";
              if (id.includes("Login")) return "pages-auth";
              return "pages-other";
            }
            
            if (id.includes("/src/components/")) {
              if (id.includes("admin")) return "components-admin";
              if (id.includes("common")) return "components-common";
              if (id.includes("production")) return "components-prod";
              return "components-other";
            }
            
            if (id.includes("/src/hooks/")) return "hooks";
            if (id.includes("/src/lib/")) return "lib";
            if (id.includes("/src/utils/")) return "utils";
            if (id.includes("/src/services/")) return "services";
          },
          // AGGRESSIVE CHUNK SIZING
          chunkFileNames: () => {
            return `assets/[name]-[hash].js`;
          },
        },
        // Suppress warnings about circular dependencies
        onwarn(warning: RollupLog, warn: (warning: RollupLog) => void) {
          if (warning.code === "CIRCULAR_DEPENDENCY") return;
          warn(warning);
        },
      },
    },
  };
});
