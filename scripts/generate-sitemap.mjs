import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = process.env.VITE_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://assistjur.com.br';
const routesPath = new URL('./routes.json', import.meta.url);

const stripTracking = (url) =>
  url
    .replace(/(\?|&)(utm_[^=&]+|gclid|fbclid)=[^&]*/g, '')
    .replace(/\?&/, '?')
    .replace(/\?$/, '');

async function generate() {
  const raw = await readFile(routesPath, 'utf8');
  const routes = [...new Set(JSON.parse(raw))].sort();
  const lastmod = new Date().toISOString();

  const urls = routes
    .map((path) => new URL(path, BASE_URL).toString())
    .map((url) => stripTracking(url))
    .map(
      (url) =>
        `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  const outDir = fileURLToPath(new URL('../public', import.meta.url));
  const outPath = join(outDir, 'sitemap.xml');
  await writeFile(outPath, xml, 'utf8');
  console.log(`sitemap.xml generated with ${routes.length} routes`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
