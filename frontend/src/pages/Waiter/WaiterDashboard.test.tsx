import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WaiterDashboard from './WaiterDashboard';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
  }
}));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WaiterDashboard Component', () => {
  beforeEach(() => {
    localStorage.setItem('currentUser', JSON.stringify({ id: 1, name: 'Joao', role: 'Garçom' }));
    (api.get as any).mockResolvedValue({ data: [{ id: 1, number: 1, status: 'Livre', current_waiter_id: null }] });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders tables and navigates on click', async () => {
    render(
      <MemoryRouter>
        <WaiterDashboard />
      </MemoryRouter>
    );

    // Ensure it renders "Mesas" and waits for loading to finish
    const mesa = await screen.findByText('1');
    expect(mesa).toBeInTheDocument();
    
    // Click on mesa 1
    fireEvent.click(mesa);
    
    // Should navigate
    expect(mockNavigate).toHaveBeenCalledWith('/waiter/menu/1');
  });
});
