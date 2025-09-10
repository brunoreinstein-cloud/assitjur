/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportCsvButton } from '@/components/mapa/ExportCsvButton';
import { useMapaTestemunhasStore } from '@/lib/store/mapa-testemunhas';
import {
  exportProcessosToCSV,
  exportTestemunhasToCSV,
  validateExportSize,
  estimateCSVSize,
} from '@/lib/csv';

vi.mock('@/lib/csv', () => ({
  exportProcessosToCSV: vi.fn(() => 1),
  exportTestemunhasToCSV: vi.fn(() => 1),
  validateExportSize: vi.fn(() => ({ isValid: true })),
  estimateCSVSize: vi.fn(() => '1 KB'),
}));

describe('ExportCsvButton PII masking', () => {
  beforeEach(() => {
    useMapaTestemunhasStore.setState({ isPiiMasked: true });
  });

  it('passes maskPII=true when exporting processos', () => {
    const data = [{ cnj: '1', reclamante_limpo: 'João' } as any];
    render(<ExportCsvButton data={data} />);
    fireEvent.click(screen.getByRole('button', { name: /Exportar dados como CSV/ }));
    fireEvent.click(screen.getByText('Todos os registros'));
    expect(exportProcessosToCSV).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ maskPII: true }));
  });

  it('passes maskPII=true when exporting testemunhas', () => {
    const data = [{ nome_testemunha: 'Ana', cnjs_como_testemunha: [] } as any];
    render(<ExportCsvButton data={data} />);
    fireEvent.click(screen.getByRole('button', { name: /Exportar dados como CSV/ }));
    fireEvent.click(screen.getByText('Todos os registros'));
    expect(exportTestemunhasToCSV).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ maskPII: true }));
  });
});
