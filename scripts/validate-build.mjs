import { access, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const distDir = fileURLToPath(new URL('../dist', import.meta.url));

async function checkFileExists(filePath, description) {
  try {
    await access(filePath);
    console.log(`✅ ${description} exists`);
    return true;
  } catch {
    console.log(`❌ ${description} missing: ${filePath}`);
    return false;
  }
}

async function validateBuild() {
  console.log('🔍 Validating build output...\n');
  
  let allValid = true;
  
  // Core files
  allValid &= await checkFileExists(join(distDir, 'index.html'), 'Main index.html');
  allValid &= await checkFileExists(join(distDir, '404.html'), 'SPA fallback (404.html)');
  
  // Assets
  allValid &= await checkFileExists(join(distDir, 'assets'), 'Assets directory');
  
  // SEO files
  allValid &= await checkFileExists(join(distDir, 'sitemap.xml'), 'Sitemap');
  
  // Build status
  allValid &= await checkFileExists(join(distDir, 'build-status.json'), 'Build status file');
  
  // Check if build was successful
  try {
    const statusRaw = await readFile(join(distDir, 'build-status.json'), 'utf8');
    const status = JSON.parse(statusRaw);
    if (status.success) {
      console.log(`✅ Build status: SUCCESS (${status.timestamp})`);
    } else {
      console.log(`❌ Build status: FAILED (${status.timestamp})`);
      allValid = false;
    }
  } catch {
    console.log('⚠️  Could not read build status');
  }
  
  // Static pages
  const staticPages = ['/mapa', '/planos', '/contato', '/blog', '/termos', '/privacidade'];
  console.log('\n📄 Checking static pages:');
  
  for (const page of staticPages) {
    const pagePath = join(distDir, page, 'index.html');
    await checkFileExists(pagePath, `Static page: ${page}`);
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allValid) {
    console.log('🎉 Build validation PASSED! All files are present.');
    process.exit(0);
  } else {
    console.log('❌ Build validation FAILED! Some files are missing.');
    process.exit(1);
  }
}

validateBuild().catch((err) => {
  console.error('💥 Validation error:', err);
  process.exit(1);
});