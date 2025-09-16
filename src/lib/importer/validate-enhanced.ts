import { intelligentValidateAndCorrect } from '@/lib/importer/intelligent-corrector';

// Enhanced validation with intelligent correction
export { intelligentValidateAndCorrect };

// Legacy export for backward compatibility
export async function normalizeAndValidate(
  session: any,
  autoCorrections: any,
  file?: File
) {
  return intelligentValidateAndCorrect(session, autoCorrections, file);
}