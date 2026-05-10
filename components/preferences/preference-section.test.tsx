import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreferenceSection } from './preference-section';

describe('PreferenceSection', () => {
  it('renderiza título, descrição e children', () => {
    render(
      <PreferenceSection title="Visibilidade de tickets" description="Quem enxerga o quê na fila.">
        <div data-testid="child">Conteúdo</div>
      </PreferenceSection>,
    );

    expect(
      screen.getByRole('heading', { name: 'Visibilidade de tickets', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Quem enxerga o quê na fila.')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
