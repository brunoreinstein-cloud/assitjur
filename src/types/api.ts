import { z } from 'zod';

export const HealthResponse = z.object({
  status: z.enum(['healthy']),
  timestamp: z.string(),
  services: z.object({
  api: z.string(),
  database: z.string()
})
});
export type HealthResponse = z.infer<typeof HealthResponse>;

export const HealthError = z.object({
  status: z.string(),
  error: z.string()
});
export type HealthError = z.infer<typeof HealthError>;

export const ExportRequest = z.object({
  messageId: z.string(),
  type: z.enum(['pdf', 'csv', 'json']),
  blocks: z.array(z.object({
  type: z.string(),
  title: z.string(),
  data: z.object({

}).catchall(z.any()).optional(),
  citations: z.array(z.object({
  source: z.string(),
  ref: z.string()
})).optional()
}))
});
export type ExportRequest = z.infer<typeof ExportRequest>;

export const ExportResponse = z.object({
  url: z.string(),
  filename: z.string(),
  type: z.enum(['pdf', 'csv', 'json']),
  size: z.number(),
  createdAt: z.string()
});
export type ExportResponse = z.infer<typeof ExportResponse>;

export const ErrorResponse = z.object({
  error: z.string()
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
