'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useCurrentUser } from '@/contexts/current-user-context';
import {
  useCompanySettingsControllerFindMine,
  companySettingsControllerFindMineQueryKey,
} from '@/lib/generated/hooks/useCompanySettingsControllerFindMine';
import {
  useCompanySettingsControllerUpdateMine,
  companySettingsControllerUpdateMineMutationKey,
} from '@/lib/generated/hooks/useCompanySettingsControllerUpdateMine';
import type { CompanySettingsResponseDto } from '@/lib/generated/types/CompanySettingsResponseDto';
import { Skeleton } from '@/components/ui/skeleton';
import { PreferencesFormView, type PreferencesFormValues } from './preferences-form-view';

function toFormValues(settings: CompanySettingsResponseDto): PreferencesFormValues {
  return {
    hideOtherUsersTickets: settings.hideOtherUsersTickets,
    agentSeeOtherUsersTicketsOnSameChannel: settings.agentSeeOtherUsersTicketsOnSameChannel,
    agentSeeTicketsWithOtherDefaultAgents: settings.agentSeeTicketsWithOtherDefaultAgents,
    hidePhoneFromAgents: settings.hidePhoneFromAgents,
    ignoreGroupMessages: settings.ignoreGroupMessages,
    showAssignedGroups: settings.showAssignedGroups,
    forceWalletRouting: settings.forceWalletRouting,
    agentCanDeleteContacts: settings.agentCanDeleteContacts,
    agentCanChangeDefaultAgent: settings.agentCanChangeDefaultAgent,
    agentCanEditTags: settings.agentCanEditTags,
    agentCanToggleSignature: settings.agentCanToggleSignature,
    hideBotTicketsFromAgents: settings.hideBotTicketsFromAgents,
  };
}

export function PreferencesForm() {
  const me = useCurrentUser();
  const canEdit = me.role === 'ADMIN' || me.role === 'SUPER_ADMIN';

  const queryClient = useQueryClient();
  const query = useCompanySettingsControllerFindMine({ client: { client: apiClient } });
  const mutation = useCompanySettingsControllerUpdateMine({
    client: { client: apiClient },
    mutation: {
      mutationKey: companySettingsControllerUpdateMineMutationKey(),
      onSuccess: () => {
        toast.success('Preferências atualizadas');
        void queryClient.invalidateQueries({
          queryKey: companySettingsControllerFindMineQueryKey(),
        });
      },
    },
  });

  const defaultValues = useMemo(() => (query.data ? toFormValues(query.data) : null), [query.data]);

  if (query.isPending) {
    return (
      <div data-testid="preferences-skeleton" className="flex flex-col gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError || !defaultValues) {
    return (
      <div
        data-testid="preferences-error"
        className="border-border-default rounded-md border p-6 text-center"
      >
        <p className="text-text-secondary text-sm">
          Não conseguimos carregar as preferências. Recarregue a página.
        </p>
      </div>
    );
  }

  return (
    <PreferencesFormView
      key={query.dataUpdatedAt}
      defaultValues={defaultValues}
      canEdit={canEdit}
      isSubmitting={mutation.isPending}
      onSubmit={(dirty) => mutation.mutate({ data: dirty })}
    />
  );
}
