export async function initSentry() {
  if (!process.env.SENTRY_DSN) return null;
  try {
    // @ts-ignore optional dependency
    const Sentry = await import('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 1.0 });
    return Sentry;
  } catch {
    console.warn('Sentry not available');
    return null;
  }
}
