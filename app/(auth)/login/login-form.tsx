'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthControllerLogin } from '@/lib/generated/hooks/useAuthControllerLogin';
import { apiClientConfig } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha precisa ter pelo menos 8 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const login = useAuthControllerLogin({ client: apiClientConfig });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await login.mutateAsync({ data: values });
      router.push('/atendimentos');
    } catch (err: unknown) {
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>Acesse sua conta DigiChat</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
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
              <p className="text-danger-600 text-sm" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-danger-600 text-sm" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          {submitError ? (
            <p className="text-danger-600 text-sm" role="alert">
              {submitError}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
