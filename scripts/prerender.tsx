// 🔥 CRITICAL: Disable all Node.js caching to prevent stale code execution
process.env.NODE_OPTIONS = "--no-compilation-cache";

// garante o flag mesmo se alguém rodar localmente sem script do npm
process.env.PRERENDER = process.env.PRERENDER ?? "1";

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
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import PublicHome from "../src/pages/PublicHome";
import { Head } from "../src/lib/head";
import { ConsentProvider } from "../src/hooks/useConsent";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPagesDir = path.resolve(__dirname, "..", "src", "pages-static");

const routes = [
  {
    path: "/",
    render: () =>
      renderToString(
        <StaticRouter location="/">
          <ConsentProvider>
            <PublicHome skipFooter={true} />
          </ConsentProvider>
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
