import type { Metadata } from 'next';
import { RegisterForm } from '@/components/register-form';

export const metadata: Metadata = {
  title: 'Criar conta — DigiChat',
};

export default function RegisterPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <RegisterForm />
      </div>
    </div>
  );
}
