// Enhanced validation moved from lib/importer/validate-enhanced.ts
export { normalizeAndValidate } from '@/lib/importer/validate-enhanced';

// Import canonical synonym system for new validation pipeline
export { 
  findCanonicalFieldName, 
  applyCanonicalMapping, 
  generateCanonicalMappingReport 
} from '@/features/importer/etl/canonical-synonyms';