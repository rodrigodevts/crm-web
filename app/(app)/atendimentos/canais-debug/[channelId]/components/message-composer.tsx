'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useTicketsMessagesControllerSend } from '@/lib/generated/hooks/useTicketsMessagesControllerSend';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const composerSchema = z.object({
  type: z.literal('TEXT'),
  text: z
    .string()
    .min(1, 'Texto da mensagem é obrigatório')
    .max(4096, 'Texto da mensagem excede o limite de 4096 caracteres'),
});

type FormValues = z.infer<typeof composerSchema>;

export function MessageComposer({ ticketId }: { ticketId: string | null }) {
  const send = useTicketsMessagesControllerSend({ client: { client: apiClient } });

  const form = useForm<FormValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: { type: 'TEXT', text: '' },
  });

  const disabled = ticketId == null;

  const onSubmit = form.handleSubmit((values) => {
    if (ticketId == null) return;
    send.mutate(
      { id: ticketId, data: values },
      {
        onSuccess: () => form.reset({ type: 'TEXT', text: '' }),
        onError: () => toast.error('Falha ao enviar a mensagem.'),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="border-border flex flex-col gap-2 rounded-md border p-4">
      <Label htmlFor="debug-composer-text">
        {disabled
          ? 'Sem mensagens ainda — não há ticket para responder.'
          : `Respondendo ticket ${ticketId.slice(0, 8)}`}
      </Label>
      <Textarea
        id="debug-composer-text"
        rows={3}
        placeholder="Escreva uma mensagem de texto…"
        disabled={disabled || send.isPending}
        aria-invalid={!!form.formState.errors.text}
        {...form.register('text')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void onSubmit();
          }
        }}
      />
      {form.formState.errors.text && (
        <p className="text-destructive text-xs">{form.formState.errors.text.message}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={disabled || send.isPending}>
          {send.isPending ? 'Enviando…' : 'Enviar'}
        </Button>
      </div>
    </form>
  );
}
