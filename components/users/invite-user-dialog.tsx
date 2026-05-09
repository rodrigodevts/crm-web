'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CopyIcon } from 'lucide-react';
import { useInvitationsControllerCreate } from '@/lib/generated/hooks/useInvitationsControllerCreate';
import { invitationsControllerListQueryKey } from '@/lib/generated/hooks/useInvitationsControllerList';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

// Roles convidáveis pelo admin via UI: ADMIN, SUPERVISOR e AGENT.
// SUPER_ADMIN não é convidável (decisão de produto + rejeitado pelo backend).
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'AGENT', label: 'Atendente' },
] as const;

type InvitableRole = (typeof ROLE_OPTIONS)[number]['value'];

const formSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email em formato inválido'),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT']),
});

type FormValues = z.infer<typeof formSchema>;

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  return false;
}

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', role: 'AGENT' },
  });

  const create = useInvitationsControllerCreate({ client: { client: apiClient } });

  const handleClose = () => {
    setOpen(false);
    setSubmitError(null);
    setEmailError(null);
    reset();
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setEmailError(null);
    try {
      const created = await create.mutateAsync({ data: values });

      toast.success(`Convite criado para ${created.email}`, {
        description: (
          <div className="flex flex-col items-start gap-2">
            <span>Compartilhe o link manualmente até o disparo automático ser implementado.</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto gap-1 px-0 py-0"
              onClick={() => {
                void copyToClipboard(created.inviteUrl).then((ok) => {
                  if (ok) toast.info('Link copiado para a área de transferência');
                  else toast.error('Não foi possível copiar o link');
                });
              }}
            >
              <CopyIcon className="size-3" />
              Copiar link
            </Button>
          </div>
        ),
      });

      // Invalida todas as variantes paginadas/por status da listagem
      void queryClient.invalidateQueries({
        queryKey: invitationsControllerListQueryKey(),
        exact: false,
      });
      handleClose();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })
        ?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;

      if (status === 409 && message) {
        setEmailError(message);
      } else if (status === 400) {
        setSubmitError('Não foi possível validar os dados.');
      } else if (typeof status === 'number' && status >= 500) {
        setSubmitError('Erro no servidor. Tente novamente em instantes.');
      } else {
        setSubmitError('Sem conexão com o servidor.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button>Convidar usuário</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
          <DialogDescription>
            Defina o email e o perfil. Geramos um link de aceite que você compartilha manualmente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-email" required>
                E-mail
              </FieldLabel>
              <Input
                id="invite-email"
                type="email"
                autoComplete="off"
                placeholder="usuario@empresa.com"
                aria-invalid={!!errors.email || !!emailError}
                {...register('email')}
              />
              {errors.email ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.email.message}
                </FieldDescription>
              ) : emailError ? (
                <FieldDescription className="text-destructive" role="alert">
                  {emailError}
                </FieldDescription>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role" required>
                Perfil
              </FieldLabel>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as InvitableRole)}
                  >
                    <SelectTrigger id="invite-role" aria-invalid={!!errors.role}>
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
            {submitError ? (
              <FieldDescription className="text-destructive" role="alert">
                {submitError}
              </FieldDescription>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? (
                'Criando…'
              ) : (
                <>
                  <CopyIcon className="size-4" />
                  Criar convite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
