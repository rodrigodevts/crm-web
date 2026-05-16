'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useTicketsMessagesControllerSend } from '@/lib/generated/hooks/useTicketsMessagesControllerSend';
import { createMessageBodyDtoSchema } from '@/lib/generated/schemas/createMessageBodyDtoSchema';
import type { TicketsMessagesControllerSendMutationRequest } from '@/lib/generated/types/TicketsMessagesControllerSend';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FormValues = TicketsMessagesControllerSendMutationRequest;

// Kubb gera o schema com `as unknown as z.ZodType<T>` apagando `_input`.
// @hookform/resolvers/zod exige Zod3Type<Output,Input> onde Input extends FieldValues.
// Cast estrutural abaixo satisfaz o overload sem perda de segurança de runtime.
const resolverSchema = createMessageBodyDtoSchema as unknown as {
  _output: FormValues;
  _input: FormValues;
  _def: { typeName: string };
};

export function MessageComposer({ ticketId }: { ticketId: string | null }) {
  const send = useTicketsMessagesControllerSend({ client: { client: apiClient } });

  const form = useForm<FormValues>({
    resolver: zodResolver(resolverSchema),
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
