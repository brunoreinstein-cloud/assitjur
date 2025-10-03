import {
  ProcessosRequestSchema,
  type ProcessosRequest,
} from "@/contracts/mapa-contracts";

export type MapaTestemunhasRequest = ProcessosRequest;

export function normalizeMapaRequest(payload: unknown): MapaTestemunhasRequest {
  return ProcessosRequestSchema.parse(payload);
}
