export class RateLimiter {
  private counts = new Map<string, { count: number; reset: number }>();
  constructor(private limit: number, private windowMs: number) {}

  check(key: string, now = Date.now()): boolean {
    const entry = this.counts.get(key);
    if (!entry || now > entry.reset) {
      this.counts.set(key, { count: 1, reset: now + this.windowMs });
      return true;
    }
    if (entry.count >= this.limit) {
      return false;
    }
    entry.count++;
    return true;
  }
}
