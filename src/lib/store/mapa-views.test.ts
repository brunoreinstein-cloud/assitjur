import { vi, describe, it, expect, beforeEach } from "vitest";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";

const defaultVisibility = {
  processos: {
    cnj: true,
    uf: true,
    comarca: true,
    fase: true,
    status: true,
    reclamante: true,
    qtdDepos: true,
    testemunhas: true,
    classificacao: true,
    acoes: true,
  },
  testemunhas: {
    nome: true,
    qtdDepo: true,
    ambosPolos: true,
    jaReclamante: true,
    cnjs: true,
    classificacao: true,
    acoes: true,
  },
};

describe("mapa views persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      data: {} as Record<string, string>,
      setItem(key: string, value: string) {
        this.data[key] = value;
      },
      getItem(key: string) {
        return this.data[key];
      },
      removeItem(key: string) {
        delete this.data[key];
      },
      clear() {
        this.data = {};
      },
    });
    useMapaTestemunhasStore.setState({
      processoFilters: {},
      testemunhaFilters: {},
      columnVisibility: JSON.parse(JSON.stringify(defaultVisibility)),
      savedViews: {},
      activeView: null,
    });
  });

  it("saves and restores view for a user", () => {
    const store = useMapaTestemunhasStore.getState();
    store.setProcessoFilters({ status: "Ativo" });
    store.setColumnVisibility("processos", "uf", false);
    store.saveView("teste", "user1");

    // simulate new session
    useMapaTestemunhasStore.setState({
      processoFilters: {},
      testemunhaFilters: {},
      columnVisibility: JSON.parse(JSON.stringify(defaultVisibility)),
      savedViews: {},
      activeView: null,
    });

    useMapaTestemunhasStore.getState().loadViews("user1");

    const state = useMapaTestemunhasStore.getState();
    expect(state.activeView).toBe("teste");
    expect(state.processoFilters.status).toBe("Ativo");
    expect(state.columnVisibility.processos.uf).toBe(false);
  });
});
