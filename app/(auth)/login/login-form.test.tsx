import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './login-form';

const pushMock = vi.fn();
const loginMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: pushMock }),
}));

vi.mock('@/lib/generated/hooks/useAuthControllerLogin', () => ({
  useAuthControllerLogin: () => ({
    mutateAsync: loginMock,
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function renderWithQuery(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
  });

  it('renders email/password fields and submit button', () => {
    renderWithQuery(<LoginForm />);
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('submits with body { email, password } and redirects on success', async () => {
    loginMock.mockResolvedValueOnce({ user: { id: 'u1', name: 'Maria' } });

    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.type(screen.getByLabelText(/e-mail/i), 'maria@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        data: { email: 'maria@example.com', password: 'senha123' },
      });
      expect(pushMock).toHaveBeenCalledWith('/atendimentos');
    });
  });

  it('shows inline error on 401', async () => {
    loginMock.mockRejectedValueOnce({ response: { status: 401 } });

    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.type(screen.getByLabelText(/e-mail/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'errada123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/e-mail ou senha incorretos/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
