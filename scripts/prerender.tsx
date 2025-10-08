// 🔥 CRITICAL: Cache busting MUST be FIRST - before ANY imports
// This prevents tsx from loading old cached versions of src/ modules

// garante o flag mesmo se alguém rodar localmente sem script do npm
process.env.PRERENDER = process.env.PRERENDER ?? "1";

// 🔥 AGGRESSIVE CACHE BUSTING - Force Node.js to invalidate ALL module caches
Object.keys(require.cache).forEach((key) => {
  delete require.cache[key];
});

// 🔍 VALIDATION: Ensure NO src/ modules are cached after cleanup
const cachedSrcModules = Object.keys(require.cache).filter(k => k.includes('/src/'));
if (cachedSrcModules.length > 0) {
  console.error('⚠️ WARNING: Found cached src/ modules after cleanup:');
  cachedSrcModules.forEach(m => console.error(`  - ${m}`));
  throw new Error('Cache cleanup failed - src/ modules still in cache');
}

// Ensure required envs exist during prerender stage without hitting real backends
process.env.VITE_SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://placeholder.supabase.co";
process.env.VITE_SUPABASE_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "placeholder-key";
process.env.VITE_PUBLIC_SITE_URL =
  process.env.VITE_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://assistjur.com.br";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import React from "react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPagesDir = path.resolve(__dirname, "..", "src", "pages-static");

const routes = [
  {
    path: "/",
    render: () =>
      renderToString(
        <StaticRouter location="/">
          <PublicHome skipFooter={true} />
        </StaticRouter>,
      ),
    head: {
      title: "AssistJur.IA - Assistente de Testemunhas",
      description:
        "Análise avançada de testemunhas para processos trabalhistas - Identifique padrões suspeitos e riscos processuais",
      ogImage: "https://assistjur.com.br/brand/og-assistjur.png",
    },
  },
  {
    path: "/termos",
    render: () =>
      fs.readFileSync(path.join(staticPagesDir, "termos.html"), "utf-8"),
    head: {
      title: "Termos de Uso - AssistJur.IA",
      description:
        "Análise avançada de testemunhas para processos trabalhistas - Identifique padrões suspeitos e riscos processuais",
      ogImage: "https://assistjur.com.br/brand/og-assistjur.png",
    },
  },
  {
    path: "/privacidade",
    render: () =>
      fs.readFileSync(path.join(staticPagesDir, "privacidade.html"), "utf-8"),
    head: {
      title: "Política de Privacidade - AssistJur.IA",
      description:
        "Análise avançada de testemunhas para processos trabalhistas - Identifique padrões suspeitos e riscos processuais",
      ogImage: "https://assistjur.com.br/brand/og-assistjur.png",
    },
  },
];

const distDir = path.resolve(__dirname, "..", "dist");
const template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

// 🔥 DYNAMIC IMPORTS - Load React modules AFTER cache cleanup
const { renderToString, renderToStaticMarkup } = await import("react-dom/server");
const { StaticRouter } = await import("react-router-dom/server");
const { default: PublicHome } = await import("../src/pages/PublicHome.js");
const { Head } = await import("../src/lib/head.js");

console.log('✅ All modules loaded fresh (post cache-cleanup)');

for (const route of routes) {
  try {
    console.log(`[PRERENDER] Processing route: ${route.path}`);
    
    const appHtml = route.render();
    const headHtml = renderToStaticMarkup(
      <Head {...route.head} path={route.path} />,
    );

    let html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`,
    );
    html = html.replace("</head>", `${headHtml}</head>`);

    const outDir = path.join(
      distDir,
      route.path === "/" ? "" : route.path.substring(1),
    );
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
    
    console.log(`[PRERENDER] ✅ Success: ${route.path}`);
  } catch (err) {
    console.error(`[PRERENDER ERROR] Route: ${route.path}`);
    console.error(`Message: ${(err as Error)?.message}`);
    console.error(`Stack: ${(err as Error)?.stack}`);
    process.exit(1);
  }
}
