'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, LoaderIcon } from 'lucide-react';
import type { UserResponseDtoRoleEnumKey } from '@/lib/generated/types/UserResponseDto';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { channelFormSchema, type ChannelFormValues } from './channel-form-schema';

export type RevealState = 'masked' | 'revealing' | 'revealed';
export type DialogMode = 'create' | 'edit';

interface NamedItem {
  id: string;
  name: string;
}

export interface ChannelDialogViewProps {
  mode: DialogMode;
  open: boolean;
  role: UserResponseDtoRoleEnumKey;
  departments: ReadonlyArray<NamedItem>;
  closeReasons: ReadonlyArray<NamedItem>;
  defaultValues: ChannelFormValues | null;
  submitting: boolean;
  revealState: RevealState;
  onSubmit: (
    values: ChannelFormValues,
    dirtyFields: Partial<Record<keyof ChannelFormValues, true>>,
  ) => void;
  onReveal: () => void;
  onClose: () => void;
}

const EMPTY_VALUES: ChannelFormValues = {
  name: '',
  provider: 'GUPSHUP',
  phoneNumber: '',
  apiKey: '',
  appId: '',
  appName: '',
  defaultDepartmentId: null,
  inactivityTimeoutMinutes: null,
  inactivityCloseReasonId: null,
};

export function ChannelDialogView({
  mode,
  open,
  role,
  departments,
  closeReasons,
  defaultValues,
  submitting,
  revealState,
  onSubmit,
  onReveal,
  onClose,
}: ChannelDialogViewProps) {
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const showReveal = mode === 'edit' && isAdmin && revealState !== 'revealed';
  const credentialsLocked = mode === 'edit' && revealState !== 'revealed';

  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  useEffect(() => {
    form.reset(defaultValues ?? EMPTY_VALUES);
  }, [defaultValues, form]);

  const timeoutValue = form.watch('inactivityTimeoutMinutes');

  function submit(values: ChannelFormValues) {
    const dirtyFields = form.formState.dirtyFields as Partial<
      Record<keyof ChannelFormValues, true>
    >;
    onSubmit(values, dirtyFields);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Novo canal' : 'Editar canal'}</DialogTitle>
          <DialogDescription>Configurações do canal de WhatsApp via Gupshup.</DialogDescription>
        </DialogHeader>

        <form
          id="channel-form"
          onSubmit={form.handleSubmit(submit)}
          className="flex flex-col gap-4"
        >
          <Field>
            <FieldLabel htmlFor="ch-name" required>
              Nome
            </FieldLabel>
            <Input
              id="ch-name"
              {...form.register('name')}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <FieldError>{form.formState.errors.name.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-provider" required>
              Tipo
            </FieldLabel>
            <Select disabled value="GUPSHUP">
              <SelectTrigger id="ch-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GUPSHUP">Gupshup</SelectItem>
                <SelectItem value="BAILEYS" disabled>
                  Baileys (disponível na Fase 7)
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-phone" required>
              Telefone do canal
            </FieldLabel>
            <Input
              id="ch-phone"
              {...form.register('phoneNumber')}
              aria-invalid={!!form.formState.errors.phoneNumber}
            />
            <FieldDescription>
              Somente números, sem &quot;+&quot; nem espaços. Ex.: 5511999998888
            </FieldDescription>
            {form.formState.errors.phoneNumber && (
              <FieldError>{form.formState.errors.phoneNumber.message}</FieldError>
            )}
          </Field>

          {showReveal && (
            <div className="border-border bg-muted/30 flex items-center justify-between gap-3 rounded-md border p-3">
              <p className="text-muted-foreground text-sm">
                Credenciais ocultas. Revele para editar.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={revealState === 'revealing'}
                onClick={onReveal}
              >
                {revealState === 'revealing' ? (
                  <>
                    <LoaderIcon className="size-4 animate-spin" aria-hidden="true" /> Revelando…
                  </>
                ) : (
                  <>
                    <EyeIcon className="size-4" aria-hidden="true" /> Revelar credenciais
                  </>
                )}
              </Button>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="ch-apikey" required>
              API Key
            </FieldLabel>
            <Input
              id="ch-apikey"
              readOnly={credentialsLocked}
              {...form.register('apiKey')}
              aria-invalid={!!form.formState.errors.apiKey}
            />
            {form.formState.errors.apiKey && (
              <FieldError>{form.formState.errors.apiKey.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-appid" required>
              App ID
            </FieldLabel>
            <Input
              id="ch-appid"
              readOnly={credentialsLocked}
              {...form.register('appId')}
              aria-invalid={!!form.formState.errors.appId}
            />
            {form.formState.errors.appId && (
              <FieldError>{form.formState.errors.appId.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-appname" required>
              App Name
            </FieldLabel>
            <Input
              id="ch-appname"
              {...form.register('appName')}
              aria-invalid={!!form.formState.errors.appName}
            />
            {form.formState.errors.appName && (
              <FieldError>{form.formState.errors.appName.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-dept">Departamento padrão</FieldLabel>
            <Controller
              control={form.control}
              name="defaultDepartmentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? '__none__'}
                  onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                >
                  <SelectTrigger id="ch-dept">
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem departamento padrão</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <fieldset className="border-border flex flex-col gap-3 rounded-md border p-4">
            <legend className="text-foreground px-1 text-sm font-medium">
              Auto-fechamento por inatividade
            </legend>
            <Field>
              <FieldLabel htmlFor="ch-timeout">Timeout (minutos)</FieldLabel>
              <Controller
                control={form.control}
                name="inactivityTimeoutMinutes"
                render={({ field }) => (
                  <Input
                    id="ch-timeout"
                    type="number"
                    min={1}
                    max={43200}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? null : Number(v));
                    }}
                    aria-invalid={!!form.formState.errors.inactivityTimeoutMinutes}
                  />
                )}
              />
              <FieldDescription>
                Em branco = desabilitado. Tickets em modo bot não são fechados por este timeout.
              </FieldDescription>
              {form.formState.errors.inactivityTimeoutMinutes && (
                <FieldError>{form.formState.errors.inactivityTimeoutMinutes.message}</FieldError>
              )}
            </Field>

            {timeoutValue !== null && timeoutValue > 0 && (
              <Field>
                <FieldLabel htmlFor="ch-reason" required>
                  Motivo de fechamento
                </FieldLabel>
                <Controller
                  control={form.control}
                  name="inactivityCloseReasonId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v === '' ? null : v)}
                    >
                      <SelectTrigger id="ch-reason">
                        <SelectValue placeholder="Selecione um motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {closeReasons.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.inactivityCloseReasonId && (
                  <FieldError>{form.formState.errors.inactivityCloseReasonId.message}</FieldError>
                )}
              </Field>
            )}
          </fieldset>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="channel-form" disabled={submitting}>
            {submitting ? 'Salvando…' : mode === 'create' ? 'Criar canal' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
