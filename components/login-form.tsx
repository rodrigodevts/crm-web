'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthControllerLogin } from '@/lib/generated/hooks/useAuthControllerLogin';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha precisa ter pelo menos 8 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const login = useAuthControllerLogin({ client: { client: apiClient } });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await login.mutateAsync({ data: values });
      router.push('/atendimentos');
    } catch (err: unknown) {
      // erro do axios via TanStack Query vem tipado como `unknown`; estrutura conhecida.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setSubmitError('E-mail ou senha incorretos.');
      } else if (typeof status === 'number' && status >= 500) {
        setSubmitError('Erro no servidor. Tente novamente em instantes.');
      } else {
        setSubmitError('Sem conexão com o servidor.');
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8" noValidate>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
                <p className="text-muted-foreground text-balance">Acesse sua conta DigiChat</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email ? (
                  <p className="text-destructive text-sm" role="alert">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password ? (
                  <p className="text-destructive text-sm" role="alert">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>
              {submitError ? (
                <p className="text-destructive text-sm" role="alert">
                  {submitError}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? 'Entrando…' : 'Entrar'}
              </Button>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="text-foreground text-3xl font-bold tracking-tight">DigiChat</span>
              <p className="text-muted-foreground max-w-xs text-sm">
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
