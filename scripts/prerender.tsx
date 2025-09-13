import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import PublicHome from '../src/pages/PublicHome';
import { Head } from '../src/lib/head';

const staticPagesDir = path.resolve(__dirname, '..', 'src', 'pages-static');

const routes = [
  {
    path: '/',
    render: () =>
      renderToString(
        <StaticRouter location="/">
          <PublicHome />
        </StaticRouter>
      ),
    head: {
      title: 'AssistJur.IA - Assistente de Testemunhas',
      description:
        'Análise avançada de testemunhas para processos trabalhistas - Identifique padrões suspeitos e riscos processuais',
      ogImage: 'https://assistjur.com.br/brand/og-assistjur.png',
    },
  },
  {
    path: '/termos',
    render: () => fs.readFileSync(path.join(staticPagesDir, 'termos.html'), 'utf-8'),
    head: {
      title: 'Termos de Uso - AssistJur.IA',
      description:
        'Análise avançada de testemunhas para processos trabalhistas - Identifique padrões suspeitos e riscos processuais',
      ogImage: 'https://assistjur.com.br/brand/og-assistjur.png',
    },
  },
  {
    path: '/privacidade',
    render: () => fs.readFileSync(path.join(staticPagesDir, 'privacidade.html'), 'utf-8'),
    head: {
      title: 'Política de Privacidade - AssistJur.IA',
      description:
        'Análise avançada de testemunhas para processos trabalhistas - Identifique padrões suspeitos e riscos processuais',
      ogImage: 'https://assistjur.com.br/brand/og-assistjur.png',
    },
  },
];

const distDir = path.resolve(__dirname, '..', 'dist');
const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

for (const route of routes) {
  const appHtml = route.render();
  const headHtml = renderToStaticMarkup(<Head {...route.head} path={route.path} />);

  let html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  html = html.replace('</head>', `${headHtml}</head>`);

  const outDir = path.join(distDir, route.path === '/' ? '' : route.path.substring(1));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
}
