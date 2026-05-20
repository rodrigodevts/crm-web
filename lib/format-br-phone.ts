import { formatPhoneDigits } from '@/components/ui/masked-phone-input';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatBrPhone(input: string): string {
  const d = digitsOnly(input);
  if (!d) return '';
  return formatPhoneDigits(d);
}

export function maskBrPhone(input: string): string {
  const d = digitsOnly(input);
  if (!d) return '';
  if (d.length < 4) return '•••';
  return `••• ${d.slice(-4)}`;
}
