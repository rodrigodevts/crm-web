'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';

// Formata uma string só de dígitos no padrão E.164 brasileiro pra exibição.
// Aceita celulares (13 dígitos: 55 + DDD + 9 + 8 dígitos) e fixos (12 dígitos:
// 55 + DDD + 8 dígitos). Para outros países, mantém o country code mas exibe
// o restante em blocos genéricos.
//
// Estados intermediários (usuário digitando):
//   ""              → ""
//   "5"             → "+5"
//   "55"            → "+55"
//   "5511"          → "+55 (11"
//   "551199"        → "+55 (11) 99"
//   "55119999"      → "+55 (11) 9999"
//   "5511999998"    → "+55 (11) 99999-8"
//   "5511999998888" → "+55 (11) 99999-8888"
export function formatPhoneDigits(digits: string): string {
  const d = digits.slice(0, 13);
  if (d.length === 0) return '';
  if (d.length <= 2) return `+${d}`;
  if (d.length <= 4) return `+${d.slice(0, 2)} (${d.slice(2)}`;
  if (d.length <= 8) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4)}`;
  if (d.length <= 12) {
    // 9–12 dígitos → assina como fixo (assinante de 8)
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, d.length - 4)}-${d.slice(-4)}`;
  }
  // 13 dígitos → assina como celular (assinante de 9)
  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
}

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

interface MaskedPhoneInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type'
> {
  /** Valor em dígitos puros (sem `+`, parênteses ou hífens). */
  value: string;
  /** Recebe os dígitos puros (até 13). */
  onChange: (digits: string) => void;
}

export function MaskedPhoneInput({ value, onChange, ...props }: MaskedPhoneInputProps) {
  return (
    <Input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      value={formatPhoneDigits(value)}
      onChange={(e) => {
        const digits = stripNonDigits(e.target.value).slice(0, 13);
        onChange(digits);
      }}
    />
  );
}
