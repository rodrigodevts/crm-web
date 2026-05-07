import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

const mutateAsync = vi.fn();
vi.mock('@/lib/generated/hooks/useAuthControllerRegister', () => ({
  useAuthControllerRegister: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

import { RegisterForm } from './register-form';

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^empresa$/i), 'Acme');
  await user.type(screen.getByLabelText(/seu nome/i), 'João Silva');
  await user.type(screen.getByLabelText(/^e-mail$/i), 'joao@acme.com');
  await user.type(screen.getByLabelText(/^senha$/i), 'password123');
  await user.type(screen.getByLabelText(/confirmar senha/i), 'password123');
  await user.click(screen.getByLabelText(/aceito os termos/i));
}

describe('RegisterForm', () => {
  beforeEach(() => {
    push.mockReset();
    mutateAsync.mockReset();
  });

  it('renderiza todos os campos obrigatórios', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/^empresa$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/seu nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/aceito os termos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });

  it('mostra erros de validação quando submete vazio', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(
      await screen.findByText(/nome da empresa deve ter pelo menos 2 caracteres/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/seu nome deve ter pelo menos 2 caracteres/i)).toBeInTheDocument();
    expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument();
    expect(screen.getByText(/senha precisa ter pelo menos 8 caracteres/i)).toBeInTheDocument();
    expect(screen.getByText(/você precisa aceitar os termos/i)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('mostra erro quando confirmar senha não bate', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/^empresa$/i), 'Acme');
    await user.type(screen.getByLabelText(/seu nome/i), 'João');
    await user.type(screen.getByLabelText(/^e-mail$/i), 'joao@acme.com');
    await user.type(screen.getByLabelText(/^senha$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar senha/i), 'wrong-pass-12');
    await user.click(screen.getByLabelText(/aceito os termos/i));
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/as senhas não conferem/i)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submete payload sem confirmPassword e navega no sucesso', async () => {
    mutateAsync.mockResolvedValueOnce({ id: 'u1', email: 'joao@acme.com' });
    const user = userEvent.setup();
    render(<RegisterForm />);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith({
      data: {
        companyName: 'Acme',
        adminName: 'João Silva',
        adminEmail: 'joao@acme.com',
        password: 'password123',
        acceptTerms: true,
      },
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/atendimentos'));
  });

  it('mostra mensagem amigável quando email já cadastrado (409)', async () => {
    mutateAsync.mockRejectedValueOnce({ response: { status: 409 } });
    const user = userEvent.setup();
    render(<RegisterForm />);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/e-mail já cadastrado/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('mostra erro de servidor para 5xx', async () => {
    mutateAsync.mockRejectedValueOnce({ response: { status: 500 } });
    const user = userEvent.setup();
    render(<RegisterForm />);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/erro no servidor/i)).toBeInTheDocument();
  });
});
