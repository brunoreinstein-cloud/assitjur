import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = process.env.VITE_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://assistjur.com.br';
const routesPath = new URL('./routes.json', import.meta.url);

async function generateStaticPages() {
  try {
    console.log('🏗️  Starting prerender process...');
    
    // Read the base index.html template
    const distDir = fileURLToPath(new URL('../dist', import.meta.url));
    const indexPath = join(distDir, 'index.html');
    
    let indexHtml;
    try {
      indexHtml = await readFile(indexPath, 'utf8');
    } catch (error) {
      console.log('⚠️  index.html not found in dist/ - skipping prerender');
      return;
    }
    
    // Read routes
    const routesRaw = await readFile(routesPath, 'utf8');
    const routes = JSON.parse(routesRaw);
    
    console.log(`📄 Generating ${routes.length} static pages...`);
    
    // Generate static pages for each route
    for (const route of routes) {
      let pagePath = route;
      if (route === '/') {
        continue; // Skip root, already handled by index.html
      }
      
      // Create directory structure
      const pageDir = join(distDir, route);
      await mkdir(pageDir, { recursive: true });
      
      // Customize HTML for each page
      let pageHtml = indexHtml;
      
      // Basic page-specific metadata
      const pageTitle = getPageTitle(route);
      const pageDescription = getPageDescription(route);
      
      pageHtml = pageHtml.replace(
        /<title>.*?<\/title>/,
        `<title>${pageTitle}</title>`
      );
      
      pageHtml = pageHtml.replace(
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="${pageDescription}">`
      );
      
      // Add canonical URL
      const canonicalUrl = `${BASE_URL}${route}`;
      if (!pageHtml.includes('rel="canonical"')) {
        pageHtml = pageHtml.replace(
          /<\/head>/,
          `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`
        );
      }
      
      // Write the page
      const pageFile = join(pageDir, 'index.html');
      await writeFile(pageFile, pageHtml, 'utf8');
    }
    
    console.log('✅ Prerender completed successfully');
  } catch (error) {
    console.error('❌ Prerender failed:', error);
    process.exit(1);
  }
}

function getPageTitle(route) {
  const titles = {
    '/mapa': 'Mapa do Site - AssistJur.IA',
    '/planos': 'Planos e Preços - AssistJur.IA',
    '/contato': 'Contato - AssistJur.IA',
    '/blog': 'Blog - AssistJur.IA',
    '/termos': 'Termos de Uso - AssistJur.IA',
    '/privacidade': 'Política de Privacidade - AssistJur.IA'
  };
  return titles[route] || 'AssistJur.IA - Inteligência Artificial Jurídica';
}

function getPageDescription(route) {
  const descriptions = {
    '/mapa': 'Navegue pelo mapa completo do site AssistJur.IA e encontre rapidamente o que procura.',
    '/planos': 'Conheça nossos planos e escolha a melhor opção para suas necessidades jurídicas.',
    '/contato': 'Entre em contato conosco. Estamos aqui para ajudar com suas dúvidas.',
    '/blog': 'Artigos e insights sobre inteligência artificial aplicada ao direito.',
    '/termos': 'Termos de uso da plataforma AssistJur.IA.',
    '/privacidade': 'Política de privacidade e proteção de dados da AssistJur.IA.'
  };
  return descriptions[route] || 'Inteligência artificial especializada em análise jurídica e processamento de documentos legais.';
}

generateStaticPages().catch((err) => {
  console.error(err);
  process.exit(1);
});