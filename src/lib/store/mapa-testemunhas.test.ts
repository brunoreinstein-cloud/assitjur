import { describe, it, expect, beforeEach } from 'vitest';
import { useMapaTestemunhasStore } from '@/lib/store/mapa-testemunhas';

describe('mapa-testemunhas store filters', () => {
  beforeEach(() => {
    useMapaTestemunhasStore.getState().resetFilters();
  });

  it('removes processo filters when set to undefined', () => {
    const { setProcessoFilters } = useMapaTestemunhasStore.getState();
    setProcessoFilters({ status: 'ativo', uf: 'SP' });
    expect(useMapaTestemunhasStore.getState().processoFilters).toEqual({ status: 'ativo', uf: 'SP' });

    setProcessoFilters({ status: undefined });
    expect(useMapaTestemunhasStore.getState().processoFilters).toEqual({ uf: 'SP' });
    expect(useMapaTestemunhasStore.getState().processoFilters).not.toHaveProperty('status');
  });

  it('removes testemunha filters when set to undefined', () => {
    const { setTestemunhaFilters } = useMapaTestemunhasStore.getState();
    setTestemunhaFilters({ search: 'joao', temTroca: true });
    expect(useMapaTestemunhasStore.getState().testemunhaFilters).toEqual({ search: 'joao', temTroca: true });

    setTestemunhaFilters({ temTroca: undefined });
    expect(useMapaTestemunhasStore.getState().testemunhaFilters).toEqual({ search: 'joao' });
    expect(useMapaTestemunhasStore.getState().testemunhaFilters).not.toHaveProperty('temTroca');
  });
});
