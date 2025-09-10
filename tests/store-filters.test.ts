/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useMapaTestemunhasStore } from '@/lib/store/mapa-testemunhas';

describe('mapa store filter removal', () => {
  beforeEach(() => {
    useMapaTestemunhasStore.setState({ processoFilters: {}, testemunhaFilters: {} });
  });

  it('removes processo filter when undefined', () => {
    const { setProcessoFilters } = useMapaTestemunhasStore.getState();
    setProcessoFilters({ uf: 'SP' } as any);
    setProcessoFilters({ uf: undefined } as any);
    expect(useMapaTestemunhasStore.getState().processoFilters.uf).toBeUndefined();
  });

  it('removes testemunha filter when undefined', () => {
    const { setTestemunhaFilters } = useMapaTestemunhasStore.getState();
    setTestemunhaFilters({ nome: 'Ana' } as any);
    setTestemunhaFilters({ nome: undefined } as any);
    expect(useMapaTestemunhasStore.getState().testemunhaFilters.nome).toBeUndefined();
  });
});
