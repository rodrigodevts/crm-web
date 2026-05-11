'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { UserResponseDtoRoleEnumKey } from '@/lib/generated/types/UserResponseDto';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import {
  useChannelsControllerCreate,
  channelsControllerCreateMutationKey,
} from '@/lib/generated/hooks/useChannelsControllerCreate';
import {
  useChannelsControllerUpdate,
  channelsControllerUpdateMutationKey,
} from '@/lib/generated/hooks/useChannelsControllerUpdate';
import {
  useChannelsControllerReveal,
  channelsControllerRevealMutationKey,
} from '@/lib/generated/hooks/useChannelsControllerReveal';
import { channelsControllerListQueryKey } from '@/lib/generated/hooks/useChannelsControllerList';
import { useDepartmentsControllerList } from '@/lib/generated/hooks/useDepartmentsControllerList';
import { useCloseReasonsControllerList } from '@/lib/generated/hooks/useCloseReasonsControllerList';
import { ChannelDialogView, type RevealState } from './channel-dialog-view';
import type { ChannelFormValues } from './channel-form-schema';

export interface ChannelDialogProps {
  mode: 'create' | 'edit';
  channel: ChannelResponseDto | null;
  open: boolean;
  role: UserResponseDtoRoleEnumKey;
  onClose: () => void;
}

function toFormValues(
  channel: ChannelResponseDto | null,
  revealedConfig: { apiKey: string; appId: string; appName: string } | null,
): ChannelFormValues | null {
  if (!channel) return null;
  return {
    name: channel.name,
    provider: 'GUPSHUP',
    phoneNumber: channel.phoneNumber ?? '',
    apiKey: revealedConfig?.apiKey ?? channel.config?.apiKey ?? '',
    appId: revealedConfig?.appId ?? channel.config?.appId ?? '',
    appName: revealedConfig?.appName ?? channel.config?.appName ?? '',
    defaultDepartmentId: channel.defaultDepartmentId,
    inactivityTimeoutMinutes: channel.inactivityTimeoutMinutes,
    inactivityCloseReasonId: channel.inactivityCloseReasonId,
  };
}

type AxiosErrorShape = {
  response?: { status?: number; data?: { message?: string; details?: unknown } };
};

function mapServerError(err: unknown): void {
  const e = err as AxiosErrorShape;
  const status = e?.response?.status;
  const data = e?.response?.data;
  if ((status === 409 || status === 400) && typeof data?.message === 'string') {
    toast.error(data.message);
    return;
  }
  toast.error('Não foi possível salvar o canal. Tente novamente.');
}

export function ChannelDialog({ mode, channel, open, role, onClose }: ChannelDialogProps) {
  const queryClient = useQueryClient();
  const [revealState, setRevealState] = useState<RevealState>('masked');
  // Após reveal, guardamos as credenciais reais para reusar no submit quando o
  // usuário muda apenas phoneNumber (precisamos enviar config.sourcePhone junto).
  const [revealedConfig, setRevealedConfig] = useState<{
    apiKey: string;
    appId: string;
    appName: string;
  } | null>(null);

  const departments = useDepartmentsControllerList(
    { limit: 100, active: true },
    { client: { client: apiClient } },
  );
  // O endpoint /close-reasons retorna `unknown` no OpenAPI (gap do backend — schema
  // ainda não definido). Tipamos localmente o shape mínimo que consumimos aqui.
  // TODO: remover quando o backend expuser CloseReasonListResponseDto.
  const closeReasons = useCloseReasonsControllerList(undefined, {
    client: { client: apiClient },
  }) as { data?: { items?: ReadonlyArray<{ id: string; name: string }> } };

  const createMutation = useChannelsControllerCreate({
    client: { client: apiClient },
    mutation: { mutationKey: channelsControllerCreateMutationKey() },
  });
  const updateMutation = useChannelsControllerUpdate({
    client: { client: apiClient },
    mutation: { mutationKey: channelsControllerUpdateMutationKey() },
  });
  const revealMutation = useChannelsControllerReveal({
    client: { client: apiClient },
    mutation: { mutationKey: channelsControllerRevealMutationKey() },
  });

  function handleClose() {
    setRevealState('masked');
    setRevealedConfig(null);
    onClose();
  }

  async function handleReveal() {
    if (!channel) return;
    setRevealState('revealing');
    try {
      const data = await revealMutation.mutateAsync({ id: channel.id });
      setRevealedConfig({ apiKey: data.apiKey, appId: data.appId, appName: data.appName });
      setRevealState('revealed');
      toast.success('Credenciais reveladas — esta ação foi registrada em auditoria.');
    } catch {
      setRevealState('masked');
      toast.error('Não foi possível revelar as credenciais.');
    }
  }

  async function handleSubmit(
    values: ChannelFormValues,
    dirtyFields: Partial<Record<keyof ChannelFormValues, true>>,
  ) {
    if (mode === 'create') {
      const payload = {
        name: values.name,
        provider: 'GUPSHUP' as const,
        phoneNumber: values.phoneNumber,
        config: {
          apiKey: values.apiKey,
          appId: values.appId,
          appName: values.appName,
          sourcePhone: values.phoneNumber,
        },
        defaultDepartmentId: values.defaultDepartmentId,
        inactivityTimeoutMinutes: values.inactivityTimeoutMinutes,
        inactivityCloseReasonId: values.inactivityCloseReasonId,
      };
      try {
        await createMutation.mutateAsync({ data: payload });
        toast.success('Canal criado.');
        void queryClient.invalidateQueries({
          queryKey: channelsControllerListQueryKey(),
          exact: false,
        });
        handleClose();
      } catch (err) {
        mapServerError(err);
      }
      return;
    }

    // edit mode
    if (!channel) return;
    const data: Record<string, unknown> = {};
    if (dirtyFields.name) data.name = values.name;
    if (dirtyFields.defaultDepartmentId) data.defaultDepartmentId = values.defaultDepartmentId;
    if (dirtyFields.inactivityTimeoutMinutes)
      data.inactivityTimeoutMinutes = values.inactivityTimeoutMinutes;
    if (dirtyFields.inactivityCloseReasonId)
      data.inactivityCloseReasonId = values.inactivityCloseReasonId;

    const phoneDirty = dirtyFields.phoneNumber === true;
    const credsDirty =
      dirtyFields.apiKey === true || dirtyFields.appId === true || dirtyFields.appName === true;

    if (phoneDirty) data.phoneNumber = values.phoneNumber;

    if (phoneDirty || credsDirty) {
      const baseConfig = revealedConfig ?? {
        apiKey: values.apiKey,
        appId: values.appId,
        appName: values.appName,
      };
      data.config = {
        apiKey: credsDirty ? values.apiKey : baseConfig.apiKey,
        appId: credsDirty ? values.appId : baseConfig.appId,
        appName: credsDirty ? values.appName : baseConfig.appName,
        sourcePhone: values.phoneNumber,
      };
    }

    if (Object.keys(data).length === 0) {
      handleClose();
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: channel.id, data });
      toast.success('Canal atualizado.');
      void queryClient.invalidateQueries({
        queryKey: channelsControllerListQueryKey(),
        exact: false,
      });
      handleClose();
    } catch (err) {
      mapServerError(err);
    }
  }

  const defaultValues = toFormValues(channel, revealedConfig);
  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <ChannelDialogView
      mode={mode}
      open={open}
      role={role}
      departments={departments.data?.items ?? []}
      closeReasons={closeReasons.data?.items ?? []}
      defaultValues={defaultValues}
      submitting={submitting}
      revealState={revealState}
      onSubmit={handleSubmit}
      onReveal={handleReveal}
      onClose={handleClose}
    />
  );
}
