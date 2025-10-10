#!/usr/bin/env node

/**
 * Copy SPA Fallback Files
 * 
 * Creates 200.html and 404.html copies of index.html for SPA routing
 * This ensures that all routes are served the main app bundle
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const distDir = 'dist';
const indexFile = join(distDir, 'index.html');
const fallback200 = join(distDir, '200.html');
const fallback404 = join(distDir, '404.html');

try {
  console.log('📄 Creating SPA fallback files...');
  
  // Read index.html
  const indexContent = readFileSync(indexFile, 'utf8');
  
  // Create 200.html (for successful SPA routing)
  writeFileSync(fallback200, indexContent);
  console.log('✅ Created 200.html');
  
  // Create 404.html (for 404 fallback)
  writeFileSync(fallback404, indexContent);
  console.log('✅ Created 404.html');
  
  console.log('🎉 SPA fallback files created successfully!');
} catch (error) {
  console.error('❌ Error creating SPA fallback files:', error.message);
  process.exit(1);
}