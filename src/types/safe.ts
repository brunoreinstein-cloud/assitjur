export const asString = (v: string | undefined | null, d = ""): string => v ?? d;
export const isNonNull = <T>(x: T | null | undefined): x is T => x !== null && x !== undefined;
