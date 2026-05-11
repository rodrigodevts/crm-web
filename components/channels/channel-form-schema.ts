import { z } from 'zod';

export const channelFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres'),
    provider: z.literal('GUPSHUP'),
    phoneNumber: z
      .string()
      .trim()
      .min(1, 'Telefone é obrigatório')
      .regex(/^\d+$/, 'Apenas dígitos, sem "+" nem espaços. Ex.: 5511999998888'),
    apiKey: z.string().min(1, 'apiKey é obrigatório'),
    appId: z.string().min(1, 'appId é obrigatório'),
    appName: z.string().min(1, 'appName é obrigatório'),
    defaultDepartmentId: z.string().uuid().nullable(),
    inactivityTimeoutMinutes: z
      .number({ error: 'Informe um número inteiro' })
      .int()
      .positive('Deve ser maior que zero')
      .max(43200)
      .nullable(),
    inactivityCloseReasonId: z.string().uuid().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.inactivityTimeoutMinutes && !data.inactivityCloseReasonId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inactivityCloseReasonId'],
        message: 'Selecione um motivo de fechamento.',
      });
    }
  });

export type ChannelFormValues = z.infer<typeof channelFormSchema>;
