'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthControllerRegister } from '@/lib/generated/hooks/useAuthControllerRegister';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const formSchema = z
  .object({
    companyName: z
      .string()
      .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
      .max(100, 'Nome da empresa deve ter no máximo 100 caracteres'),
    adminName: z
      .string()
      .min(2, 'Seu nome deve ter pelo menos 2 caracteres')
      .max(100, 'Seu nome deve ter no máximo 100 caracteres'),
    adminEmail: z.string().email('E-mail inválido'),
    password: z
      .string()
      .min(8, 'Senha precisa ter pelo menos 8 caracteres')
      .max(128, 'Senha muito longa'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: 'Você precisa aceitar os termos de uso' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      adminName: '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
      // RHF aceita boolean — coerção para o literal `true` é validada pelo Zod no submit.
      acceptTerms: false as unknown as true,
    },
  });

  const registerMutation = useAuthControllerRegister({ client: { client: apiClient } });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    const { confirmPassword: _confirm, ...payload } = values;
    try {
      await registerMutation.mutateAsync({ data: payload });
      router.push('/atendimentos');
    } catch (err: unknown) {
      // erro do axios via TanStack Query vem tipado como `unknown`; estrutura conhecida.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setSubmitError('E-mail já cadastrado.');
      } else if (status === 400) {
        setSubmitError('Não foi possível criar a conta. Verifique os dados.');
      } else if (typeof status === 'number' && status >= 500) {
        setSubmitError('Erro no servidor. Tente novamente em instantes.');
      } else {
        setSubmitError('Sem conexão com o servidor.');
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8" noValidate>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Criar sua conta</h1>
                <p className="text-muted-foreground text-balance">
                  Cadastre sua empresa e comece a atender no DigiChat
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="companyName">Empresa</FieldLabel>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Nome da sua empresa"
                  autoComplete="organization"
                  aria-invalid={!!errors.companyName}
                  {...register('companyName')}
                />
                {errors.companyName ? (
                  <FieldDescription className="text-destructive" role="alert">
                    {errors.companyName.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="adminName">Seu nome</FieldLabel>
                <Input
                  id="adminName"
                  type="text"
                  placeholder="Como devemos te chamar"
                  autoComplete="name"
                  aria-invalid={!!errors.adminName}
                  {...register('adminName')}
                />
                {errors.adminName ? (
                  <FieldDescription className="text-destructive" role="alert">
                    {errors.adminName.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="adminEmail">E-mail</FieldLabel>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  aria-invalid={!!errors.adminEmail}
                  {...register('adminEmail')}
                />
                {errors.adminEmail ? (
                  <FieldDescription className="text-destructive" role="alert">
                    {errors.adminEmail.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
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
                <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
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
              <Field orientation="horizontal">
                <Controller
                  name="acceptTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="acceptTerms"
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-invalid={!!errors.acceptTerms}
                    />
                  )}
                />
                <FieldLabel htmlFor="acceptTerms" className="font-normal">
                  Li e aceito os termos de uso e a política de privacidade
                </FieldLabel>
              </Field>
              {errors.acceptTerms ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.acceptTerms.message}
                </FieldDescription>
              ) : null}
              {submitError ? (
                <FieldDescription className="text-destructive" role="alert">
                  {submitError}
                </FieldDescription>
              ) : null}
              <Field>
                <Button type="submit" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? 'Criando conta…' : 'Criar conta'}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Já tem conta?{' '}
                <Link href="/login" className="underline-offset-4 hover:underline">
                  Entrar
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="from-primary to-primary-700 relative hidden bg-linear-to-br md:block">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="text-primary-foreground text-3xl font-bold tracking-tight">
                DigiChat
              </span>
              <p className="text-primary-foreground/80 max-w-xs text-sm">
                CRM omnichannel WhatsApp multi-tenant. Atendimento, automação e métricas num lugar
                só.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
