import { describe, it, expect } from "vitest";
import {
  ProcessosRequestSchema,
  TestemunhasRequestSchema,
} from "../src/contracts/mapa-contracts";
import { toFieldErrors } from "../supabase/functions/_shared/validation";

describe("ProcessosRequestSchema", () => {
  it("accepts valid payload", () => {
    const res = ProcessosRequestSchema.safeParse({});
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.paginacao.page).toBe(1);
    }
  });

  it("rejects invalid page and date range", () => {
    const res = ProcessosRequestSchema.safeParse({
      paginacao: { page: 0 },
      filtros: { data_inicio: "2024-02-01", data_fim: "2024-01-01" },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const fe = toFieldErrors(res.error);
      expect(fe["paginacao.page"]).toBeTruthy();
      expect(fe["filtros.data_inicio"]).toBeTruthy();
    }
  });
});

describe("TestemunhasRequestSchema", () => {
  it("accepts valid payload", () => {
    const res = TestemunhasRequestSchema.safeParse({});
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.paginacao.limit).toBe(20);
    }
  });

  it("rejects invalid date format", () => {
    const res = TestemunhasRequestSchema.safeParse({
      filtros: { data_inicio: "invalid-date" },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const fe = toFieldErrors(res.error);
      expect(fe["filtros.data_inicio"]).toBeTruthy();
    }
  });
});
