import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  it('renders email and password fields with the submit button', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });
});
