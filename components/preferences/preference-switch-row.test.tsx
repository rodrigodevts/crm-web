import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PreferenceSwitchRow } from './preference-switch-row';

function Wrapper({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

describe('PreferenceSwitchRow', () => {
  it('renderiza label, descrição e switch com estado controlado', () => {
    render(
      <PreferenceSwitchRow
        id="test-flag"
        label="Ocultar tickets de outros atendentes"
        description="Atendente vê apenas tickets atribuídos a ele e os pendentes do departamento."
        checked={true}
        onCheckedChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    const sw = screen.getByRole('switch', {
      name: 'Ocultar tickets de outros atendentes',
    });
    expect(sw).toBeChecked();
    expect(screen.getByText(/atendente vê apenas tickets/i)).toBeInTheDocument();
  });

  it('chama onCheckedChange ao clicar', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PreferenceSwitchRow
        id="test-flag"
        label="Flag X"
        description="Helper X"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
      { wrapper: Wrapper },
    );

    await user.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('quando disabled, switch não aceita clique e mostra tooltip de razão', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PreferenceSwitchRow
        id="test-flag"
        label="Flag X"
        description="Helper X"
        checked={false}
        onCheckedChange={onCheckedChange}
        disabled
        disabledReason="Apenas administradores podem alterar"
      />,
      { wrapper: Wrapper },
    );

    const sw = screen.getByRole('switch');
    expect(sw).toBeDisabled();
    await user.click(sw);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('linka helper ao switch via aria-describedby', () => {
    render(
      <PreferenceSwitchRow
        id="test-flag"
        label="Flag X"
        description="Helper descritivo"
        checked={false}
        onCheckedChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    const sw = screen.getByRole('switch');
    const describedBy = sw.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const helper = document.getElementById(describedBy as string);
    expect(helper?.textContent).toBe('Helper descritivo');
  });
});
