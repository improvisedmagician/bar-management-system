import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WaiterLogin from './WaiterLogin';
import { api } from '../../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
  }
}));

describe('WaiterLogin Component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders login options and navigates on click', async () => {
    (api.post as any).mockResolvedValue({ data: { id: 1, name: 'João', role: 'Garçom' } });
    
    render(
      <MemoryRouter>
        <WaiterLogin />
      </MemoryRouter>
    );

    // Find input and submit button
    const input = screen.getByPlaceholderText('Seu nome (ex: Joao)');
    const button = screen.getByRole('button', { name: /Entrar/i });
    
    // Simulate user typing name and clicking enter
    fireEvent.change(input, { target: { value: 'João' } });
    fireEvent.click(button);
    
    // Verify navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/waiter/dashboard');
    });
  });
});
