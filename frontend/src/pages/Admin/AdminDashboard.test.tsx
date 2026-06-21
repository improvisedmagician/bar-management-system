import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

describe('AdminDashboard Component', () => {
  it('renders correctly and switches tabs', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Check dashboard text
    expect(screen.getByText('Visão Geral')).toBeInTheDocument();

    // Click on Menu tab
    const menuTab = screen.getByText('Estoque');
    fireEvent.click(menuTab);

    // Check menu text
    expect(screen.getByText('Cardápio & Estoque')).toBeInTheDocument();
  });
});
