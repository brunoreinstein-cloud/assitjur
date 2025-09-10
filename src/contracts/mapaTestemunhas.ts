import { ProcessosRequestSchema, type ProcessosRequest } from './mapa-contracts';

export type MapaTestemunhasRequest = ProcessosRequest;

export function normalizeMapaRequest(payload: unknown): MapaTestemunhasRequest {
  return ProcessosRequestSchema.parse(payload);
}
