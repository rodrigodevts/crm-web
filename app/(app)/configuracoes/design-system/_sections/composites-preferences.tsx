'use client';

import { useState } from 'react';
import { PreferenceSection } from '@/components/preferences/preference-section';
import { PreferenceSwitchRow } from '@/components/preferences/preference-switch-row';

export function CompositesPreferences() {
  const [hideTickets, setHideTickets] = useState(true);
  const [forceRouting, setForceRouting] = useState(false);
  const [agentTags, setAgentTags] = useState(false);

  return (
    <section id="compostos-preferences" className="flex flex-col gap-6">
      <header>
        <h3 className="text-text-primary text-base font-semibold">
          Preferences (Card de configuração)
        </h3>
        <p className="text-text-secondary text-sm">
          Card temático com header descritivo e linhas de toggle. Usado em{' '}
          <code>/configuracoes/preferencias</code>.
        </p>
      </header>

      <PreferenceSection title="Visibilidade de tickets" description="Quem enxerga o quê na fila.">
        <PreferenceSwitchRow
          id="ds-hide-tickets"
          label="Ocultar tickets de outros atendentes"
          description="Atendente vê apenas tickets atribuídos a ele e os pendentes do departamento."
          checked={hideTickets}
          onCheckedChange={setHideTickets}
        />
        <PreferenceSwitchRow
          id="ds-force-routing"
          label="Forçar roteamento por carteira"
          description="Atribui automaticamente o ticket ao responsável padrão (carteira) do contato."
          checked={forceRouting}
          onCheckedChange={setForceRouting}
        />
      </PreferenceSection>

      <PreferenceSection
        title="Permissões do atendente (disabled)"
        description="Demonstração com switches em estado disabled e tooltip de razão."
      >
        <PreferenceSwitchRow
          id="ds-agent-tags-disabled"
          label="Atendente pode editar tags do contato"
          description="Libera adicionar e remover tags no contato durante o atendimento."
          checked={agentTags}
          onCheckedChange={setAgentTags}
          disabled
          disabledReason="Apenas administradores podem alterar"
        />
      </PreferenceSection>
    </section>
  );
}
