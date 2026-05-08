'use client';

import { useEffect, useId } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useQuickRepliesControllerCreate } from '@/lib/generated/hooks/useQuickRepliesControllerCreate';
import { useQuickRepliesControllerUpdate } from '@/lib/generated/hooks/useQuickRepliesControllerUpdate';
import { quickRepliesControllerListQueryKey } from '@/lib/generated/hooks/useQuickRepliesControllerList';
import type { QuickReplyResponseDto } from '@/lib/generated/types/QuickReplyResponseDto';
import type { CreateQuickReplyDto } from '@/lib/generated/types/CreateQuickReplyDto';
import type { UpdateQuickReplyDto } from '@/lib/generated/types/UpdateQuickReplyDto';
import { apiClient } from '@/lib/api-client';
import { useCurrentUser } from '@/contexts/current-user-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const SHORTCUT_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIME_REGEX = /^[a-z]+\/[a-z0-9.\-+]+$/;
const URL_REGEX = /^https?:\/\/.+/;
const MESSAGE_MAX = 4000;

type Scope = QuickReplyResponseDto['scope'];

const SCOPE_OPTIONS: ReadonlyArray<{ value: Scope; label: string }> = [
  { value: 'PERSONAL', label: 'Pessoal' },
  { value: 'COMPANY', label: 'Global' },
];

const formSchema = z
  .object({
    shortcut: z
      .string()
      .trim()
      .min(1, 'Informe um atalho')
      .max(50, 'Máximo de 50 caracteres')
      .regex(SHORTCUT_REGEX, 'O atalho aceita apenas letras, números, _ ou -'),
    message: z
      .string()
      .trim()
      .min(1, 'Informe a mensagem')
      .max(MESSAGE_MAX, `Máximo de ${MESSAGE_MAX} caracteres`),
    mediaUrl: z
      .string()
      .trim()
      .refine((v) => v === '' || URL_REGEX.test(v), 'URL inválida'),
    mediaMimeType: z
      .string()
      .trim()
      .refine((v) => v === '' || MIME_REGEX.test(v), 'Tipo MIME inválido'),
    scope: z.enum(['COMPANY', 'PERSONAL']),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const hasUrl = data.mediaUrl.length > 0;
    const hasMime = data.mediaMimeType.length > 0;
    if (hasUrl && !hasMime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mediaMimeType'],
        message: 'Informe o tipo da mídia ao anexar uma URL.',
      });
    }
    if (hasMime && !hasUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mediaUrl'],
        message: 'Informe a URL da mídia ao informar o tipo.',
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  shortcut: '',
  message: '',
  mediaUrl: '',
  mediaMimeType: '',
  scope: 'PERSONAL',
  active: true,
};

function toFormValues(quickReply: QuickReplyResponseDto): FormValues {
  return {
    shortcut: quickReply.shortcut,
    message: quickReply.message,
    mediaUrl: quickReply.mediaUrl ?? '',
    mediaMimeType: quickReply.mediaMimeType ?? '',
    scope: quickReply.scope,
    active: quickReply.active,
  };
}

type BackendValidationError = {
  errors?: Array<{ field: string; message: string }>;
  message?: string;
};

type AxiosLikeError = {
  response?: { status?: number; data?: BackendValidationError };
};

interface QuickReplyDialogProps {
  mode: 'create' | 'edit';
  quickReply?: QuickReplyResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickReplyDialog({ mode, quickReply, open, onOpenChange }: QuickReplyDialogProps) {
  const me = useCurrentUser();
  const queryClient = useQueryClient();
  const fieldId = useId();

  const create = useQuickRepliesControllerCreate({ client: { client: apiClient } });
  const update = useQuickRepliesControllerUpdate({ client: { client: apiClient } });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';
  const isAgent = me.role === 'AGENT';
  // Em create, AGENT só pode criar PERSONAL. Em edit, o backend recusa scope no PATCH.
  const scopeDisabled = isEdit || (isCreate && isAgent);

  useEffect(() => {
    if (!open) return;
    const next = isEdit && quickReply ? toFormValues(quickReply) : DEFAULT_VALUES;
    // AGENT não pode mudar pra COMPANY na criação — força PERSONAL.
    if (isCreate && isAgent) next.scope = 'PERSONAL';
    reset(next);
  }, [open, isCreate, isEdit, isAgent, quickReply, reset]);

  const message = useWatch({ control, name: 'message' }) ?? '';
  const remaining = MESSAGE_MAX - message.length;

  const handleClose = () => {
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    const trimmedShortcut = values.shortcut.trim();
    const trimmedMessage = values.message.trim();
    const trimmedUrl = values.mediaUrl.trim();
    const trimmedMime = values.mediaMimeType.trim();

    try {
      if (isCreate) {
        const payload: CreateQuickReplyDto = {
          shortcut: trimmedShortcut,
          message: trimmedMessage,
          scope: isAgent ? 'PERSONAL' : values.scope,
          active: values.active,
          ...(trimmedUrl ? { mediaUrl: trimmedUrl } : {}),
          ...(trimmedMime ? { mediaMimeType: trimmedMime } : {}),
        };
        const created = await create.mutateAsync({ data: payload });
        toast.success(`Resposta rápida "/${created.shortcut}" criada.`);
      } else if (quickReply) {
        const payload: UpdateQuickReplyDto = {
          shortcut: trimmedShortcut,
          message: trimmedMessage,
          active: values.active,
          mediaUrl: trimmedUrl.length > 0 ? trimmedUrl : null,
          mediaMimeType: trimmedMime.length > 0 ? trimmedMime : null,
        };
        const updated = await update.mutateAsync({ id: quickReply.id, data: payload });
        toast.success(`Resposta rápida "/${updated.shortcut}" atualizada.`);
      }

      void queryClient.invalidateQueries({
        queryKey: quickRepliesControllerListQueryKey(),
        exact: false,
      });
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      const status = axiosErr?.response?.status;
      const data = axiosErr?.response?.data;

      if (status === 409 && data?.message) {
        setError('shortcut', { message: data.message });
        return;
      }
      if (status === 400 && Array.isArray(data?.errors) && data.errors.length > 0) {
        let mappedAny = false;
        for (const issue of data.errors) {
          if (issue.field in DEFAULT_VALUES) {
            setError(issue.field as keyof FormValues, { message: issue.message });
            mappedAny = true;
          }
        }
        if (!mappedAny) {
          setError('root', { message: data.message ?? 'Não foi possível validar os dados.' });
        }
        return;
      }
      if (status === 403) {
        setError('root', {
          message: 'Apenas administradores podem criar respostas globais.',
        });
        return;
      }
      if (typeof status === 'number' && status >= 500) {
        setError('root', { message: 'Erro no servidor. Tente novamente em instantes.' });
        return;
      }
      setError('root', { message: 'Sem conexão com o servidor.' });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Nova resposta rápida' : 'Editar resposta rápida'}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Cadastre um atalho do composer para enviar mensagens recorrentes mais rápido.'
              : 'Atualize os dados da resposta rápida.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-shortcut`} required>
                Atalho
              </FieldLabel>
              <Input
                id={`${fieldId}-shortcut`}
                autoComplete="off"
                placeholder="Ex.: saudacao"
                spellCheck={false}
                aria-invalid={!!errors.shortcut}
                {...register('shortcut')}
              />
              {errors.shortcut ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.shortcut.message}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  Sem o prefixo &quot;/&quot;. Letras, números, _ ou -.
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-message`} required>
                Mensagem
              </FieldLabel>
              <Textarea
                id={`${fieldId}-message`}
                rows={4}
                placeholder="Conteúdo da mensagem; pode usar placeholders como {{nome}}."
                aria-invalid={!!errors.message}
                {...register('message')}
              />
              {errors.message ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.message.message}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  {remaining.toLocaleString('pt-BR')} caracteres restantes.
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-mediaUrl`}>URL da mídia</FieldLabel>
              <Input
                id={`${fieldId}-mediaUrl`}
                type="url"
                autoComplete="off"
                placeholder="https://…"
                spellCheck={false}
                aria-invalid={!!errors.mediaUrl}
                {...register('mediaUrl')}
              />
              {errors.mediaUrl ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.mediaUrl.message}
                </FieldDescription>
              ) : (
                <FieldDescription>Opcional. Anexe um arquivo via URL pública.</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-mediaMimeType`}>Tipo da mídia (MIME)</FieldLabel>
              <Input
                id={`${fieldId}-mediaMimeType`}
                autoComplete="off"
                placeholder="Ex.: image/jpeg"
                spellCheck={false}
                aria-invalid={!!errors.mediaMimeType}
                {...register('mediaMimeType')}
              />
              {errors.mediaMimeType ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.mediaMimeType.message}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  Obrigatório quando há URL. Ex.: image/jpeg, application/pdf.
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-scope`}>Escopo</FieldLabel>
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as Scope)}
                    disabled={scopeDisabled}
                  >
                    <SelectTrigger
                      id={`${fieldId}-scope`}
                      disabled={scopeDisabled}
                      aria-invalid={!!errors.scope}
                    >
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {isEdit ? (
                <FieldDescription>
                  Para mudar o escopo, crie uma nova resposta e desative esta.
                </FieldDescription>
              ) : isAgent ? (
                <FieldDescription>
                  Apenas administradores podem criar respostas globais.
                </FieldDescription>
              ) : (
                <FieldDescription>
                  Pessoal: visível só para você. Global: visível para o tenant inteiro.
                </FieldDescription>
              )}
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div className="flex flex-col">
                <FieldLabel htmlFor={`${fieldId}-active`} className="text-sm font-medium">
                  Ativa
                </FieldLabel>
                <FieldDescription>
                  Respostas inativas não aparecem no autocomplete do composer.
                </FieldDescription>
              </div>
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <Switch
                    id={`${fieldId}-active`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {errors.root ? (
              <FieldDescription className="text-destructive" role="alert">
                {errors.root.message}
              </FieldDescription>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando…' : isCreate ? 'Criar resposta rápida' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
