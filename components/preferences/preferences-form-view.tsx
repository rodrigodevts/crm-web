'use client';

import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { PreferenceSection } from './preference-section';
import { PreferenceSwitchRow } from './preference-switch-row';

const FORM_FIELDS = [
  'hideOtherUsersTickets',
  'agentSeeOtherUsersTicketsOnSameChannel',
  'agentSeeTicketsWithOtherDefaultAgents',
  'hidePhoneFromAgents',
  'ignoreGroupMessages',
  'showAssignedGroups',
  'forceWalletRouting',
  'agentCanDeleteContacts',
  'agentCanChangeDefaultAgent',
  'agentCanEditTags',
  'agentCanToggleSignature',
  'hideBotTicketsFromAgents',
] as const;

type FieldName = (typeof FORM_FIELDS)[number];

// Dynamic schema construction using standard Zod pattern for dynamic object shapes
const formSchema = z.object(
  Object.fromEntries(FORM_FIELDS.map((name) => [name, z.boolean()])) as Record<
    FieldName,
    z.ZodBoolean
  >,
);

export type PreferencesFormValues = z.infer<typeof formSchema>;

type SectionConfig = {
  title: string;
  description: string;
  rows: ReadonlyArray<{ name: FieldName; label: string; helper: string }>;
};

const SECTIONS: ReadonlyArray<SectionConfig> = [
  {
    title: 'Visibilidade de tickets',
    description: 'Define o que cada atendente enxerga na fila.',
    rows: [
      {
        name: 'hideOtherUsersTickets',
        label: 'Ocultar tickets de outros atendentes',
        helper: 'Atendente vê apenas tickets atribuídos a ele e os pendentes do departamento.',
      },
      {
        name: 'agentSeeOtherUsersTicketsOnSameChannel',
        label: 'Atendente vê tickets de outros do mesmo canal',
        helper: 'Permite visibilidade extra dentro do mesmo canal de atendimento.',
      },
      {
        name: 'agentSeeTicketsWithOtherDefaultAgents',
        label: 'Atendente vê tickets de contatos com outro responsável padrão',
        helper: 'Mantém visibilidade quando o contato tem responsável (carteira) diferente.',
      },
    ],
  },
  {
    title: 'Privacidade',
    description: 'Dados sensíveis exibidos para atendentes.',
    rows: [
      {
        name: 'hidePhoneFromAgents',
        label: 'Ocultar número de telefone dos atendentes',
        helper: 'Telefone do contato aparece mascarado para o perfil Atendente.',
      },
    ],
  },
  {
    title: 'Grupos do WhatsApp',
    description: 'Comportamento para mensagens vindas de grupos.',
    rows: [
      {
        name: 'ignoreGroupMessages',
        label: 'Ignorar mensagens de grupos',
        helper: 'Mensagens vindas de grupos são descartadas antes de criar ticket.',
      },
      {
        name: 'showAssignedGroups',
        label: 'Mostrar grupos atribuídos na fila',
        helper: 'Quando ligado, tickets de grupos atribuídos aparecem na listagem.',
      },
    ],
  },
  {
    title: 'Roteamento',
    description: 'Como tickets são distribuídos automaticamente.',
    rows: [
      {
        name: 'forceWalletRouting',
        label: 'Forçar roteamento por carteira',
        helper: 'Atribui automaticamente o ticket ao responsável padrão (carteira) do contato.',
      },
    ],
  },
  {
    title: 'Permissões do atendente',
    description: 'Ações liberadas para o perfil Atendente.',
    rows: [
      {
        name: 'agentCanDeleteContacts',
        label: 'Atendente pode deletar contatos',
        helper: 'Libera a ação de excluir contato para o perfil Atendente.',
      },
      {
        name: 'agentCanChangeDefaultAgent',
        label: 'Atendente pode trocar o responsável padrão do contato',
        helper: 'Permite alterar a carteira do contato sem precisar de Supervisor/Admin.',
      },
      {
        name: 'agentCanEditTags',
        label: 'Atendente pode editar tags do contato',
        helper: 'Libera adicionar e remover tags no contato durante o atendimento.',
      },
      {
        name: 'agentCanToggleSignature',
        label: 'Atendente pode escolher se assina a mensagem',
        helper:
          'Mostra checkbox "incluir assinatura" no composer; quando desligado, a assinatura segue o padrão do tenant.',
      },
    ],
  },
  {
    title: 'Bot',
    description: 'Comportamento de tickets em atendimento por bot.',
    rows: [
      {
        name: 'hideBotTicketsFromAgents',
        label: 'Ocultar tickets em atendimento por bot',
        helper:
          'Tickets que estão sendo conduzidos pelo bot ficam invisíveis para atendentes até a transferência.',
      },
    ],
  },
];

export type PreferencesFormViewProps = {
  defaultValues: PreferencesFormValues;
  canEdit: boolean;
  onSubmit: (dirtyValues: Partial<PreferencesFormValues>) => void;
  isSubmitting?: boolean;
};

export function PreferencesFormView({
  defaultValues,
  canEdit,
  onSubmit,
  isSubmitting = false,
}: PreferencesFormViewProps) {
  const formId = useId();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<PreferencesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const submit = handleSubmit((values) => {
    const dirtyOnly = Object.fromEntries(
      Object.entries(values).filter(([k]) => Boolean(dirtyFields[k as FieldName])),
    ) as Partial<PreferencesFormValues>;
    onSubmit(dirtyOnly);
  });

  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-6 pb-24">
      {SECTIONS.map((section) => (
        <PreferenceSection
          key={section.title}
          title={section.title}
          description={section.description}
        >
          {section.rows.map((row) => (
            <Controller
              key={row.name}
              control={control}
              name={row.name}
              render={({ field }) => (
                <PreferenceSwitchRow
                  id={`${formId}-${row.name}`}
                  label={row.label}
                  description={row.helper}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!canEdit}
                  disabledReason={!canEdit ? 'Apenas administradores podem alterar' : undefined}
                />
              )}
            />
          ))}
        </PreferenceSection>
      ))}

      {canEdit ? (
        <div className="bg-background border-border sticky bottom-0 -mx-6 flex justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(defaultValues)}
            disabled={!isDirty || isSubmitting}
          >
            Descartar alterações
          </Button>
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
