export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delays: number[] = [300, 600, 1200]
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status =
      error?.context?.response?.status ??
      error?.status ??
      error?.response?.status;

    const nonRetryStatuses = [400, 401, 403, 404, 422];

    if (attempts <= 1 || (status && nonRetryStatuses.includes(status))) {
      throw error;
    }

    const delay = delays[0] ?? 0;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, attempts - 1, delays.slice(1));
  }
}
