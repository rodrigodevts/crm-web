import type { Metadata } from 'next';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = {
  title: 'Entrar — DigiChat',
};

export default function LoginPage() {
  return (
    <div className="bg-background grid min-h-svh place-items-center p-6 md:p-10">
      <div className="mx-auto w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}
