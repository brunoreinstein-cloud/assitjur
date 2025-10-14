export function deferOnIdle(fn: () => void) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 500);
  }
}


