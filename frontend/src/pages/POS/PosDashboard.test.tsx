import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PosDashboard from './PosDashboard';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('PosDashboard Component', () => {
  beforeEach(() => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/cash-register/current') return Promise.resolve({ data: { id: 1, initial_balance: 100 } });
      if (url.includes('/orders/')) return Promise.resolve({ data: [
        { id: 1, table: { number: 2 }, items: [{ product: { name: 'Chopp Pilsen 300ml', price: 10 }, quantity: 1 }], status: 'Aberto' }
      ] });
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders POS main elements', async () => {
    render(
      <MemoryRouter>
        <PosDashboard />
      </MemoryRouter>
    );

    // Verify Title
    expect(await screen.findByText('PONTO DE VENDA')).toBeInTheDocument();
    
    // Verify a table from mock data
    expect(await screen.findByText('Mesa 2')).toBeInTheDocument();
  });
});
