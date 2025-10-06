export interface ObservabilityMetrics {
  totalMetrics: number;
  errors: number;
  apiCalls: number;
  userActions: number;
  averageApiDuration: number | string;
  topErrors: Array<{ error: string; count: number }>;
}

export const isObservabilityMetrics = (
  value: unknown,
): value is ObservabilityMetrics => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const metrics = value as Partial<Record<keyof ObservabilityMetrics, unknown>>;

  const hasRequiredNumbers =
    typeof metrics.totalMetrics === "number" &&
    typeof metrics.errors === "number" &&
    typeof metrics.apiCalls === "number" &&
    typeof metrics.userActions === "number";

  if (!hasRequiredNumbers) {
    return false;
  }

  const avg = metrics.averageApiDuration;
  if (
    avg !== undefined &&
    typeof avg !== "number" &&
    typeof avg !== "string"
  ) {
    return false;
  }

  if (!Array.isArray(metrics.topErrors)) {
    return false;
  }

  return metrics.topErrors.every((item) => {
    return (
      item &&
      typeof item === "object" &&
      typeof (item as { error?: unknown }).error === "string" &&
      typeof (item as { count?: unknown }).count === "number"
    );
  });
};
