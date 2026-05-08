'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInvitationsPublicControllerAccept } from '@/lib/generated/hooks/useInvitationsPublicControllerAccept';
import { apiClient } from '@/lib/api-client';
import type { PublicInvitationDtoRoleEnumKey } from '@/lib/generated/types/PublicInvitationDto';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const ROLE_LABEL: Record<PublicInvitationDtoRoleEnumKey, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  AGENT: 'Atendente',
};

const formSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome (mínimo 2 caracteres)').max(100),
    password: z.string().min(8, 'Senha precisa ter pelo menos 8 caracteres').max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

interface Props {
  token: string;
  email: string;
  role: PublicInvitationDtoRoleEnumKey;
  companyName: string;
}

export function AcceptInviteForm({ token, email, role, companyName }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const accept = useInvitationsPublicControllerAccept({ client: { client: apiClient } });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await accept.mutateAsync({
        token,
        data: { name: values.name.trim(), password: values.password },
      });
      router.push('/atendimentos');
    } catch (err: unknown) {
      // Erro do axios via TanStack Query vem como `unknown`; estrutura é conhecida.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 410) {
        setSubmitError('Este convite não está mais disponível. Peça um novo ao administrador.');
      } else if (status === 404) {
        setSubmitError('Convite não encontrado.');
      } else if (status === 400) {
        setSubmitError('Não foi possível validar os dados. Confira nome e senha.');
      } else if (typeof status === 'number' && status >= 500) {
        setSubmitError('Erro no servidor. Tente novamente em instantes.');
      } else {
        setSubmitError('Sem conexão com o servidor.');
      }
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="grid p-0 md:grid-cols-2">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8" noValidate>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Crie sua conta</h1>
              <p className="text-muted-foreground text-balance">
                Você foi convidado para <span className="font-medium">{companyName}</span>
              </p>
            </div>
            <Field>
              <FieldLabel>E-mail</FieldLabel>
              <Input value={email} readOnly disabled aria-label="E-mail (definido pelo convite)" />
            </Field>
            <Field>
              <FieldLabel>Perfil</FieldLabel>
              <Input
                value={ROLE_LABEL[role]}
                readOnly
                disabled
                aria-label="Perfil (definido pelo convite)"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="name" required>
                Nome
              </FieldLabel>
              <Input
                id="name"
                type="text"
                autoComplete="name"
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
              <FieldLabel htmlFor="password" required>
                Senha
              </FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.password.message}
                </FieldDescription>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword" required>
                Confirmar senha
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.confirmPassword.message}
                </FieldDescription>
              ) : null}
            </Field>
            {submitError ? (
              <FieldDescription className="text-destructive" role="alert">
                {submitError}
              </FieldDescription>
            ) : null}
            <Field>
              <Button type="submit" disabled={accept.isPending}>
                {accept.isPending ? 'Aceitando convite…' : 'Aceitar convite'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
        <div className="from-primary to-primary-700 relative hidden bg-linear-to-br md:block">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="text-primary-foreground text-3xl font-bold tracking-tight">
              DigiChat
            </span>
            <p className="text-primary-foreground/80 max-w-xs text-sm">
              Você está a um passo de fazer parte da equipe.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
