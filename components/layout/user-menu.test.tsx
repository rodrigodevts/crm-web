import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserMenu } from './user-menu';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';

const replaceMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
}));

vi.mock('@/lib/generated/hooks/useAuthControllerLogout', () => ({
  useAuthControllerLogout: () => ({
    mutateAsync: logoutMock,
    isPending: false,
  }),
}));

const fakeUser: UserResponseDto = {
  id: '00000000-0000-7000-8000-000000000001',
  companyId: '00000000-0000-7000-8000-000000000002',
  name: 'Maria Silva',
  email: 'maria@example.com',
  role: 'AGENT',
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: null,
  departments: [],
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
};

function renderWithProviders(ui: React.ReactNode, user: UserResponseDto = fakeUser) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CurrentUserProvider user={user}>{ui}</CurrentUserProvider>
    </QueryClientProvider>,
  );
}

describe('UserMenu', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    logoutMock.mockReset();
  });

  it('renders initials derived from user name', () => {
    renderWithProviders(<UserMenu />);
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('opens dropdown on click and shows user info', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />);

    await user.click(screen.getByRole('button', { name: /menu do usuário/i }));

    // Name appears in both the trigger button and the dropdown label — both are expected.
    expect(await screen.findAllByText('Maria Silva')).toHaveLength(2);
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /sair/i })).toBeInTheDocument();
  });

  it('calls logout mutation and replaces route on Sair click', async () => {
    logoutMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />);

    await user.click(screen.getByRole('button', { name: /menu do usuário/i }));
    await user.click(screen.getByRole('menuitem', { name: /sair/i }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledOnce();
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });
});
