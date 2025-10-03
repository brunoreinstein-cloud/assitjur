// Deno module providing Sentry integration, structured logging and metrics
import { createLogger } from "./logger.ts";

// Attempt to dynamically import Sentry (optional dependency)
// deno-lint-ignore no-explicit-any
let Sentry: any = null;
const dsn = Deno.env.get("SENTRY_DSN");
if (dsn) {
  try {
    // @ts-ignore optional dependency
    Sentry = await import("npm:@sentry/deno@7.92.0");
    Sentry.init({ dsn, tracesSampleRate: 1.0 });
  } catch (_e) {
    // ignore sentry init errors
  }
}

interface Metrics {
  durations: number[];
  errors: number;
  total: number;
}
const metrics: Record<string, Metrics> = {};

function record(name: string, duration: number, ok: boolean) {
  let m = metrics[name];
  if (!m) m = metrics[name] = { durations: [], errors: 0, total: 0 };
  m.durations.push(duration);
  if (m.durations.length > 100) m.durations.shift();
  m.total++;
  if (!ok) m.errors++;
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function metricsFor(name: string) {
  const m = metrics[name] || { durations: [], errors: 0, total: 0 };
  const p50 = percentile(m.durations, 50);
  const p95 = percentile(m.durations, 95);
  const errorRate = m.total ? m.errors / m.total : 0;
  return { p50, p95, error_rate: errorRate };
}

export function metricsHandler(name: string) {
  return new Response(JSON.stringify(metricsFor(name)), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function serve(
  name: string,
  handler: (req: Request) => Promise<Response> | Response,
) {
  return Deno.serve(async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/metrics") {
      return metricsHandler(name);
    }
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    const log = createLogger(requestId);
    const start = performance.now();
    const hdrs = new Headers(req.headers);
    hdrs.set("x-request-id", requestId);
    const wrappedReq = new Request(req, { headers: hdrs });
    try {
      const res = await handler(wrappedReq);
      const duration = performance.now() - start;
      record(name, duration, res.ok);
      const headers = new Headers(res.headers);
      headers.set("x-request-id", requestId);
      log.info(
        `${req.method} ${url.pathname} ${res.status} ${duration.toFixed(2)}ms`,
      );
      return new Response(res.body, { ...res, headers });
    } catch (err) {
      const duration = performance.now() - start;
      record(name, duration, false);
      log.error(err instanceof Error ? err.message : String(err));
      Sentry?.captureException?.(err);
      return new Response(JSON.stringify({ error: "internal_error" }), {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-request-id": requestId,
        },
      });
    }
  });
}
