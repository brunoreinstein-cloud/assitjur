/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DetailDrawer } from "@/components/mapa-testemunhas/DetailDrawer";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";

const mockTestemunha = {
  nome_testemunha: "john.doe@example.com",
  qtd_depoimentos: 1,
  cnjs_como_testemunha: [],
  ja_foi_reclamante: null,
  cnjs_como_reclamante: [],
  foi_testemunha_ativo: null,
  cnjs_ativo: [],
  foi_testemunha_passivo: null,
  cnjs_passivo: [],
  foi_testemunha_em_ambos_polos: null,
  participou_troca_favor: null,
  cnjs_troca_favor: [],
  participou_triangulacao: null,
  cnjs_triangulacao: [],
  e_prova_emprestada: null,
  classificacao: null,
  classificacao_estrategica: null,
  org_id: null,
  created_at: "",
  updated_at: "",
};

describe("DetailDrawer copy masking", () => {
  beforeEach(() => {
    (navigator as any).clipboard = { writeText: vi.fn() };
    useMapaTestemunhasStore.setState({
      isDetailDrawerOpen: true,
      isPiiMasked: true,
      selectedProcesso: null,
      selectedTestemunha: mockTestemunha,
    });
  });

  it("copies masked value to clipboard when PII mask is enabled", () => {
    render(<DetailDrawer />);
    const label = screen.getByText("Nome da Testemunha");
    const button = label.parentElement?.querySelector(
      "button",
    ) as HTMLButtonElement;
    fireEvent.click(button);
    expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith(
      "jo***@example.com",
    );
  });
});
