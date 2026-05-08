'use client';

import { useEffect, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTagsControllerCreate } from '@/lib/generated/hooks/useTagsControllerCreate';
import { useTagsControllerUpdate } from '@/lib/generated/hooks/useTagsControllerUpdate';
import { tagsControllerListQueryKey } from '@/lib/generated/hooks/useTagsControllerList';
import type { TagResponseDto } from '@/lib/generated/types/TagResponseDto';
import type { CreateTagDto, CreateTagDtoScopeEnumKey } from '@/lib/generated/types/CreateTagDto';
import type { UpdateTagDto } from '@/lib/generated/types/UpdateTagDto';
import { apiClient } from '@/lib/api-client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type Scope = CreateTagDtoScopeEnumKey;

const SCOPE_OPTIONS: ReadonlyArray<{ value: Scope; label: string; description: string }> = [
  { value: 'BOTH', label: 'Ambos', description: 'Pode ser aplicada em contatos e tickets.' },
  { value: 'CONTACT', label: 'Contato', description: 'Apenas em contatos.' },
  { value: 'TICKET', label: 'Ticket', description: 'Apenas em tickets.' },
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const DEFAULT_COLOR = '#1B84FF';

const formSchema = z.object({
  name: z.string().trim().min(1, 'Informe um nome').max(100, 'Máximo de 100 caracteres'),
  color: z.string().regex(HEX_REGEX, 'Cor deve estar no formato #RRGGBB'),
  scope: z.enum(['CONTACT', 'TICKET', 'BOTH']),
  active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  name: '',
  color: DEFAULT_COLOR,
  scope: 'BOTH',
  active: true,
};

function toFormValues(tag: TagResponseDto): FormValues {
  return {
    name: tag.name,
    color: tag.color,
    scope: tag.scope,
    active: tag.active,
  };
}

type BackendValidationError = {
  errors?: Array<{ field: string; message: string }>;
  message?: string;
};

type AxiosLikeError = {
  response?: { status?: number; data?: BackendValidationError };
};

interface TagDialogProps {
  mode: 'create' | 'edit';
  tag?: TagResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagDialog({ mode, tag, open, onOpenChange }: TagDialogProps) {
  const queryClient = useQueryClient();
  const fieldId = useId();

  const create = useTagsControllerCreate({ client: { client: apiClient } });
  const update = useTagsControllerUpdate({ client: { client: apiClient } });

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

  useEffect(() => {
    if (!open) return;
    reset(mode === 'edit' && tag ? toFormValues(tag) : DEFAULT_VALUES);
  }, [open, mode, tag, reset]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name.trim(),
      color: values.color.toUpperCase(),
      scope: values.scope,
      active: values.active,
    } satisfies CreateTagDto & UpdateTagDto;

    try {
      if (mode === 'create') {
        const created = await create.mutateAsync({ data: payload });
        toast.success(`Tag "${created.name}" criada.`);
      } else if (tag) {
        const updated = await update.mutateAsync({ id: tag.id, data: payload });
        toast.success(`Tag "${updated.name}" atualizada.`);
      }

      void queryClient.invalidateQueries({
        queryKey: tagsControllerListQueryKey(),
        exact: false,
      });
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      const status = axiosErr?.response?.status;
      const data = axiosErr?.response?.data;

      if (status === 409 && data?.message) {
        setError('name', { message: data.message });
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
        if (!mappedAny)
          setError('root', { message: data.message ?? 'Não foi possível validar os dados.' });
        return;
      }
      if (typeof status === 'number' && status >= 500) {
        setError('root', { message: 'Erro no servidor. Tente novamente em instantes.' });
        return;
      }
      setError('root', { message: 'Sem conexão com o servidor.' });
    }
  };

  const isCreate = mode === 'create';
  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Nova tag' : 'Editar tag'}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Cadastre uma tag para classificar contatos e/ou tickets.'
              : 'Atualize os dados da tag.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-name`} required>
                Nome
              </FieldLabel>
              <Input
                id={`${fieldId}-name`}
                autoComplete="off"
                placeholder="Ex.: Lead"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.name.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Controller
              control={control}
              name="color"
              render={({ field }) => {
                const safePickerValue = HEX_REGEX.test(field.value) ? field.value : DEFAULT_COLOR;
                return (
                  <Field>
                    <FieldLabel htmlFor={`${fieldId}-color-text`}>Cor (hex)</FieldLabel>
                    <div className="flex items-center gap-2">
                      <input
                        id={`${fieldId}-color-picker`}
                        type="color"
                        aria-label="Selecionar cor"
                        value={safePickerValue}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="size-9 cursor-pointer rounded-md border bg-transparent p-0.5"
                      />
                      <Input
                        id={`${fieldId}-color-text`}
                        autoComplete="off"
                        placeholder="#1B84FF"
                        spellCheck={false}
                        aria-invalid={!!errors.color}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={() => {
                          if (HEX_REGEX.test(field.value)) {
                            field.onChange(field.value.toUpperCase());
                          }
                          field.onBlur();
                        }}
                      />
                    </div>
                    {errors.color ? (
                      <FieldDescription className="text-destructive" role="alert">
                        {errors.color.message}
                      </FieldDescription>
                    ) : (
                      <FieldDescription>
                        Formato #RRGGBB. Use o seletor ou cole um hex.
                      </FieldDescription>
                    )}
                  </Field>
                );
              }}
            />

            <Field>
              <FieldLabel htmlFor={`${fieldId}-scope`}>Escopo</FieldLabel>
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as Scope)}>
                    <SelectTrigger id={`${fieldId}-scope`} aria-invalid={!!errors.scope}>
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
              <FieldDescription>Onde a tag pode ser aplicada.</FieldDescription>
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div className="flex flex-col">
                <FieldLabel htmlFor={`${fieldId}-active`} className="text-sm font-medium">
                  Ativa
                </FieldLabel>
                <FieldDescription>
                  Tags inativas não aparecem para nova atribuição.
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
              {isPending ? 'Salvando…' : isCreate ? 'Criar tag' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
