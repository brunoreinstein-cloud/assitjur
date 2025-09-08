function redact(value: string): string {
  return value.replace(/./g, "*");
}

function safeStringify(obj: unknown, keys: string[]): string {
  return JSON.stringify(obj, (key, value) => {
    if (keys.includes(key)) {
      return typeof value === "string" ? redact(value) : "[REDACTED]";
    }
    return value;
  });
}

export function secureLog(
  message: string,
  data?: Record<string, unknown>,
  keysToRedact: string[] = [],
): void {
  const payload = data ? safeStringify(data, keysToRedact) : "";
  console.log(message + (payload ? ` ${payload}` : ""));
}
