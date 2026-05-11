'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import {
  useCloseReasonsControllerCreate,
  closeReasonsControllerCreateMutationKey,
} from '@/lib/generated/hooks/useCloseReasonsControllerCreate';
import {
  useCloseReasonsControllerUpdate,
  closeReasonsControllerUpdateMutationKey,
} from '@/lib/generated/hooks/useCloseReasonsControllerUpdate';
import { closeReasonsControllerListQueryKey } from '@/lib/generated/hooks/useCloseReasonsControllerList';
import { useDepartmentsControllerList } from '@/lib/generated/hooks/useDepartmentsControllerList';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import { Textarea } from '@/components/ui/textarea';
import type { z } from 'zod';
import { closeReasonFormSchema, type CloseReasonFormValues } from './close-reason-form-schema';

// O schema usa `.default([])` em `departmentIds`, então o tipo de input do Zod
// difere do output. Para o RHF, usamos o input como FieldValues e o output como
// o tipo recebido no handler de submit.
type CloseReasonFormInput = z.input<typeof closeReasonFormSchema>;

// Shape mínimo que o dialog consome (compatível com CloseReasonDetailResponseDto
// e com items[] da list, ambos têm `departments`).
export interface CloseReasonForDialog {
  id: string;
  name: string;
  message: string | null;
  active: boolean;
  departments: ReadonlyArray<{ id: string; name: string }>;
}

export interface CloseReasonDialogProps {
  mode: 'create' | 'edit';
  reason: CloseReasonForDialog | null;
  open: boolean;
  onClose: () => void;
}

const EMPTY_VALUES: CloseReasonFormValues = {
  name: '',
  message: null,
  departmentIds: [],
};

function toFormValues(reason: CloseReasonForDialog | null): CloseReasonFormValues {
  if (!reason) return EMPTY_VALUES;
  return {
    name: reason.name,
    message: reason.message,
    departmentIds: reason.departments.map((d) => d.id),
  };
}

type AxiosErrorShape = {
  response?: { status?: number; data?: { message?: string } };
};

export function CloseReasonDialog({ mode, reason, open, onClose }: CloseReasonDialogProps) {
  const queryClient = useQueryClient();

  const departments = useDepartmentsControllerList(
    { limit: 100, active: true },
    { client: { client: apiClient } },
  );

  const createMutation = useCloseReasonsControllerCreate({
    client: { client: apiClient },
    mutation: { mutationKey: closeReasonsControllerCreateMutationKey() },
  });
  const updateMutation = useCloseReasonsControllerUpdate({
    client: { client: apiClient },
    mutation: { mutationKey: closeReasonsControllerUpdateMutationKey() },
  });

  const form = useForm<CloseReasonFormInput, unknown, CloseReasonFormValues>({
    resolver: zodResolver(closeReasonFormSchema),
    defaultValues: toFormValues(reason),
  });

  // Reset toda vez que o dialog abre OU o `reason` muda (edit de alvo
  // diferente). Sem incluir `open` nas deps, criar-fechar-criar mantinha os
  // valores do último submit.
  useEffect(() => {
    if (open) form.reset(toFormValues(reason));
  }, [open, reason, form]);

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: closeReasonsControllerListQueryKey(),
      exact: false,
    });
  }

  function mapError(err: unknown): void {
    const e = err as AxiosErrorShape;
    const status = e?.response?.status;
    const msg = e?.response?.data?.message;
    if (status === 409 && typeof msg === 'string') {
      form.setError('name', { message: msg });
      return;
    }
    if (typeof msg === 'string') {
      toast.error(msg);
      return;
    }
    toast.error('Não foi possível salvar o motivo. Tente novamente.');
  }

  async function onSubmit(values: CloseReasonFormValues) {
    if (mode === 'create') {
      try {
        await createMutation.mutateAsync({
          data: {
            name: values.name,
            message: values.message,
            departmentIds: values.departmentIds,
          },
        });
        toast.success('Motivo criado.');
        invalidate();
        onClose();
      } catch (err) {
        mapError(err);
      }
      return;
    }

    if (!reason) return;
    const dirty = form.formState.dirtyFields as Partial<Record<keyof CloseReasonFormValues, true>>;
    const data: Record<string, unknown> = {};
    if (dirty.name) data.name = values.name;
    if (dirty.message) data.message = values.message;
    if (dirty.departmentIds) data.departmentIds = values.departmentIds;

    if (Object.keys(data).length === 0) {
      onClose();
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: reason.id, data });
      toast.success('Motivo atualizado.');
      invalidate();
      onClose();
    } catch (err) {
      mapError(err);
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending;
  const departmentItems = departments.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Novo motivo' : 'Editar motivo'}</DialogTitle>
          <DialogDescription>
            Motivos de fechamento aparecem ao encerrar tickets e podem ser usados no auto-fechamento
            de canais.
          </DialogDescription>
        </DialogHeader>

        <form
          id="close-reason-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Field>
            <FieldLabel htmlFor="cr-name" required>
              Nome
            </FieldLabel>
            <Input
              id="cr-name"
              {...form.register('name')}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <FieldError>{form.formState.errors.name.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="cr-message">Mensagem automática</FieldLabel>
            <Controller
              control={form.control}
              name="message"
              render={({ field }) => (
                <Textarea
                  id="cr-message"
                  rows={3}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v.length === 0 ? null : v);
                  }}
                  onBlur={field.onBlur}
                  aria-invalid={!!form.formState.errors.message}
                />
              )}
            />
            <FieldDescription>
              Enviada ao contato antes do fechamento automático por inatividade. Opcional.
            </FieldDescription>
            {form.formState.errors.message && (
              <FieldError>{form.formState.errors.message.message}</FieldError>
            )}
          </Field>

          <fieldset className="border-border flex flex-col gap-2 rounded-md border p-4">
            <legend className="text-foreground px-1 text-sm font-medium">Departamentos</legend>
            <p className="text-muted-foreground text-xs">
              Se nenhum for selecionado, o motivo aparece para todos os departamentos.
            </p>
            <Controller
              control={form.control}
              name="departmentIds"
              render={({ field }) => (
                <MultiSelectCombobox
                  value={field.value ?? []}
                  onChange={field.onChange}
                  options={departmentItems}
                  placeholder={
                    departmentItems.length === 0
                      ? 'Nenhum departamento ativo.'
                      : 'Selecione departamentos…'
                  }
                  searchPlaceholder="Buscar departamento…"
                  emptyMessage="Nenhum departamento corresponde à busca."
                  disabled={departmentItems.length === 0}
                />
              )}
            />
          </fieldset>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="close-reason-form" disabled={submitting}>
            {submitting ? 'Salvando…' : mode === 'create' ? 'Criar motivo' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
