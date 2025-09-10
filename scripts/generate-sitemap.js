import fs from 'fs';
import path from 'path';

const baseUrl = process.env.SITE_URL || 'https://assistjur.com.br';
const files = ['src/App.tsx', 'src/routes/AdminRoutes.tsx'];
const routeRegex = /path="([^"]+)"/g;
const paths = new Set();

for (const file of files) {
  const content = fs.readFileSync(path.resolve(file), 'utf8');
  let match;
  while ((match = routeRegex.exec(content))) {
    const p = match[1];
    if (!p || p.includes('*') || p.startsWith(':')) continue;
    paths.add(p);
  }
}

paths.add('/');

const urls = Array.from(paths)
  .sort()
  .map((p) => `  <url><loc>${baseUrl}${p}</loc></url>`)
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
fs.writeFileSync(path.resolve('public/sitemap.xml'), sitemap);

const robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;
fs.writeFileSync(path.resolve('public/robots.txt'), robots);

console.log(`Generated sitemap with ${paths.size} routes.`);
