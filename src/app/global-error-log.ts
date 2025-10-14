// Fase A: Log global de erros para identificar origem com sourcemaps
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    // eslint-disable-next-line no-console
    console.error("[GlobalError]", {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: (e as any).error?.stack || String((e as any).error),
    });
  });
  window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
    const anyReason = (e as any).reason;
    // eslint-disable-next-line no-console
    console.error("[UnhandledRejection]", {
      reason: anyReason?.message || String(anyReason),
      stack: anyReason?.stack,
    });
  });
}


