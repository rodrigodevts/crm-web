import { z } from 'zod';

// TODO Fase 2 (composer): adicionar `asksDealValue: z.boolean()` quando o
//   composer com valor de venda aparecer no fechamento de ticket.
// TODO Fase 4 (CSAT): adicionar `triggersCsat: z.boolean()` quando o fluxo
//   de pesquisa de satisfação for implementado.
// TODO Fase 4+ (SalesFunnel): adicionar `funnelId: z.string().uuid().nullable()`
//   quando o modelo SalesFunnel existir no produto.
// Backend (crm-api/src/modules/close-reasons/schemas/create-close-reason.schema.ts)
// já aceita os 3 campos com defaults — só falta expor no form.

export const closeReasonFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  message: z.string().trim().max(2000, 'Máximo 2000 caracteres').nullable(),
  departmentIds: z.array(z.string().uuid()).max(50, 'Máximo 50 departamentos').default([]),
});

export type CloseReasonFormValues = z.infer<typeof closeReasonFormSchema>;
