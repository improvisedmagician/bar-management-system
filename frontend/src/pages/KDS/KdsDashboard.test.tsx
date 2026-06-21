import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KdsDashboard from './KdsDashboard';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  }
}));

describe('KdsDashboard Component', () => {
  beforeEach(() => {
    (api.get as any).mockResolvedValue({
      data: [
        {
          id: 1,
          table: { number: 1 },
          items: [
            { id: 1, product: { name: 'Porção de Fritas', category: { type: 'Cozinha' } }, quantity: 1, status: 'Na Fila', observations: null, created_at: '2023-01-01T00:00:00' },
            { id: 2, product: { name: 'Caipirinha de Limão', category: { type: 'Bar' } }, quantity: 2, status: 'Na Fila', observations: null, created_at: '2023-01-01T00:00:00' }
          ]
        }
      ]
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders KDS and filters items', async () => {
    render(
      <MemoryRouter>
        <KdsDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('KITCHEN DISPLAY')).toBeInTheDocument();
    
    // Test initial item in Cozinha
    expect(await screen.findByText('1x Porção de Fritas')).toBeInTheDocument();
    
    // Click on "Bar" filter
    fireEvent.click(screen.getByText('BAR'));
    
    // Item from Cozinha should not be present anymore
    expect(screen.queryByText('1x Porção de Fritas')).not.toBeInTheDocument();
    // Item from Bar should be present
    expect(screen.getByText('2x Caipirinha de Limão')).toBeInTheDocument();
  });
});
