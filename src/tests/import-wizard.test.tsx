import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportWizard } from '@/components/ImportWizard';

describe('ImportWizard', () => {
  test('CSV missing column shows error with line and column', async () => {
    render(<ImportWizard />);
    const input = screen.getByLabelText(/Arquivo CSV/i);
    const csv = 'CNJ,Reclamada\n123,Empresa';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() =>
      expect(screen.getByText(/Coluna Reclamante ausente/i)).toBeInTheDocument()
    );
  });

  test('invalid CNJ blocks submission with hint', async () => {
    render(<ImportWizard />);
    fireEvent.change(screen.getByLabelText(/Número CNJ/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Importar/i }));
    await waitFor(() =>
      expect(screen.getByText(/CNJ deve ter exatamente 20 dígitos/i)).toBeInTheDocument()
    );
  });

  test('valid CNJ imports successfully', async () => {
    render(<ImportWizard />);
    fireEvent.change(screen.getByLabelText(/Número CNJ/i), {
      target: { value: '0000000-00.0000.0.00.0000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Importar/i }));
    await waitFor(() =>
      expect(screen.getByText(/Processo importado com sucesso/i)).toBeInTheDocument()
    );
  });
});

