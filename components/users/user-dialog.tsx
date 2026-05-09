'use client';

import { useEffect, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUsersControllerUpdate } from '@/lib/generated/hooks/useUsersControllerUpdate';
import { usersControllerListQueryKey } from '@/lib/generated/hooks/useUsersControllerList';
import { useDepartmentsControllerList } from '@/lib/generated/hooks/useDepartmentsControllerList';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import type { UpdateUserDto } from '@/lib/generated/types/UpdateUserDto';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Skeleton } from '@/components/ui/skeleton';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'AGENT', label: 'Atendente' },
] as const;

type EditableRole = (typeof ROLE_OPTIONS)[number]['value'];

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome precisa ter pelo menos 2 caracteres')
    .max(100, 'Máximo de 100 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido'),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT']),
  departmentIds: z.array(z.string().uuid()),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  name: '',
  email: '',
  role: 'AGENT',
  departmentIds: [],
};

function toEditableRole(role: UserResponseDto['role']): EditableRole {
  return role === 'SUPER_ADMIN' ? 'ADMIN' : role;
}

function toFormValues(user: UserResponseDto): FormValues {
  return {
    name: user.name,
    email: user.email,
    role: toEditableRole(user.role),
    departmentIds: user.departments.map((d) => d.id),
  };
}

type BackendValidationError = {
  errors?: Array<{ field: string; message: string }>;
  message?: string;
};

type AxiosLikeError = {
  response?: { status?: number; data?: BackendValidationError };
};

function isLastAdminMessage(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('administrador') ||
    lower.includes('admin') ||
    lower.includes('último') ||
    lower.includes('last')
  );
}

function isEmailConflictMessage(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('email') ||
    lower.includes('e-mail') ||
    lower.includes('uso') ||
    lower.includes('exists')
  );
}

interface UserDialogProps {
  user?: UserResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
  const queryClient = useQueryClient();
  const fieldId = useId();

  const update = useUsersControllerUpdate({ client: { client: apiClient } });
  const departmentsQuery = useDepartmentsControllerList(
    { active: true, limit: 100 },
    { client: { client: apiClient } },
  );

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
    reset(user ? toFormValues(user) : DEFAULT_VALUES);
  }, [open, user, reset]);

  const handleClose = () => onOpenChange(false);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    const payload: UpdateUserDto = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      departmentIds: values.departmentIds,
    };

    try {
      await update.mutateAsync({ id: user.id, data: payload });
      toast.success(`Usuário "${payload.name}" atualizado.`);
      void queryClient.invalidateQueries({
        queryKey: usersControllerListQueryKey(),
        exact: false,
      });
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      const status = axiosErr?.response?.status;
      const data = axiosErr?.response?.data;
      const message = data?.message;

      if (status === 409 && isEmailConflictMessage(message)) {
        setError('email', { message: message ?? 'E-mail já em uso.' });
        return;
      }
      if (status === 409 && isLastAdminMessage(message)) {
        setError('root', {
          message: message ?? 'É necessário manter ao menos um administrador ativo.',
        });
        return;
      }
      if (status === 409) {
        setError('root', { message: message ?? 'Conflito ao salvar.' });
        return;
      }
      if (status === 403) {
        setError('root', { message: 'Você não tem permissão para alterar esta conta.' });
        return;
      }
      if (status === 400 && Array.isArray(data?.errors) && data.errors.length > 0) {
        let mappedAny = false;
        for (const issue of data.errors) {
          if (issue.field === 'name' || issue.field === 'email' || issue.field === 'role') {
            setError(issue.field, { message: issue.message });
            mappedAny = true;
          }
        }
        if (!mappedAny) {
          setError('root', { message: data.message ?? 'Não foi possível validar os dados.' });
        }
        return;
      }
      if (typeof status === 'number' && status >= 500) {
        setError('root', { message: 'Erro no servidor. Tente novamente em instantes.' });
        return;
      }
      setError('root', { message: 'Sem conexão com o servidor.' });
    }
  };

  const departments = departmentsQuery.data?.items ?? [];
  const isPending = update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Atualize nome, e-mail, perfil e departamentos.</DialogDescription>
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
                placeholder="Nome do usuário"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.name.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-email`} required>
                E-mail
              </FieldLabel>
              <Input
                id={`${fieldId}-email`}
                type="email"
                autoComplete="off"
                placeholder="usuario@empresa.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.email.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-role`} required>
                Perfil
              </FieldLabel>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as EditableRole)}
                  >
                    <SelectTrigger id={`${fieldId}-role`} aria-invalid={!!errors.role}>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Departamentos</FieldLabel>
              <Controller
                control={control}
                name="departmentIds"
                render={({ field }) => (
                  <div className="max-h-60 overflow-y-auto rounded-md border p-2">
                    {departmentsQuery.isPending ? (
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-3/4" />
                      </div>
                    ) : departments.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Nenhum departamento ativo cadastrado.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {departments.map((d) => {
                          const checked = field.value.includes(d.id);
                          const id = `${fieldId}-dept-${d.id}`;
                          return (
                            <div key={d.id} className="flex items-center gap-2">
                              <Checkbox
                                id={id}
                                checked={checked}
                                onCheckedChange={(next) => {
                                  if (next) {
                                    field.onChange([...field.value, d.id]);
                                  } else {
                                    field.onChange(field.value.filter((v) => v !== d.id));
                                  }
                                }}
                              />
                              <label htmlFor={id} className="text-sm">
                                {d.name}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              />
            </Field>

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
              {isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
