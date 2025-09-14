/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { mockReportData } from '@/lib/mock-data/report-sample';
import { TestAuthProvider } from './utils/testAuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('Report section selector', () => {
  it('hides ROI section when unchecked', async () => {
    const qc = new QueryClient();
    render(
      <TestAuthProvider>
        <QueryClientProvider client={qc}>
          <ReportGenerator mockData={mockReportData} />
        </QueryClientProvider>
      </TestAuthProvider>
    );

    // uncheck ROI
    const roiCheckbox = screen.getByLabelText('ROI');
    fireEvent.click(roiCheckbox);

    // fill required fields
    fireEvent.change(screen.getByLabelText('Organização *'), { target: { value: 'Org' } });
    fireEvent.change(screen.getByLabelText('Analista Responsável *'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Período - Início *'), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText('Período - Fim *'), { target: { value: '2024-01-31' } });

    // generate report
    fireEvent.click(screen.getByRole('button', { name: /Gerar Relatório/i }));

    // wait for preview
    expect(await screen.findByText('Relatório Conclusivo de Análise')).toBeInTheDocument();

    // ROI section should not be in document
    expect(screen.queryByText('ROI Estimado')).not.toBeInTheDocument();
  });
});
