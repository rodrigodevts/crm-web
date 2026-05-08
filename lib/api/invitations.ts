/**
 * Schemas Zod espelhando os DTOs de resposta de Invitation do crm-api.
 *
 * Workaround temporário para um gap de OpenAPI publishing da Sprint 0.16
 * Fase A (crm-api PR #40):
 * - 4 das 5 rotas com corpo declaram `@ZodSerializerDto` mas não declaram
 *   `@ApiOkResponse({ type: ... })` / `@ApiCreatedResponse({ type: ... })`,
 *   então o Swagger não inclui o schema de resposta no OpenAPI e o Kubb
 *   gera `Response = unknown` em `lib/generated/types/Invitations*.ts`.
 *
 * Rotas afetadas no crm-api:
 *  - src/modules/invitations/controllers/invitations.controller.ts
 *      • POST   /api/v1/invitations          → InvitationCreatedDto (faltava @ApiCreatedResponse)
 *      • GET    /api/v1/invitations          → InvitationListResponseDto (faltava @ApiOkResponse)
 *      • POST   /api/v1/invitations/:id/resend → InvitationCreatedDto (faltava @ApiOkResponse)
 *  - src/modules/invitations/controllers/invitations-public.controller.ts
 *      • GET    /api/v1/invitations/by-token/:token → PublicInvitationDto (faltava @ApiOkResponse)
 *
 * Os schemas abaixo replicam exatamente os do backend em
 * `crm-api/src/modules/invitations/schemas/invitation-response.schema.ts`.
 *
 * Quando o backend ganhar os decoradores e o `lib/generated` voltar a
 * carregar tipos concretos, este arquivo deve ser substituído por
 * importações diretas de `@/lib/generated/types/{InvitationCreatedDto,
 * InvitationListResponseDto, PublicInvitationDto}.ts` e a usagem dos
 * `parse*` removida (deixe a confiança no backend serializer + tipo
 * gerado fazer o trabalho).
 */
import { z } from 'zod';

export const invitationRoleSchema = z.enum(['ADMIN', 'SUPERVISOR', 'AGENT']);
export type InvitationRole = z.infer<typeof invitationRoleSchema>;

export const invitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REVOKED']);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

export const invitationSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: invitationRoleSchema,
  status: invitationStatusSchema,
  invitedById: z.string().uuid(),
  invitedByName: z.string(),
  acceptedById: z.string().uuid().nullable(),
  acceptedAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type InvitationResponse = z.infer<typeof invitationSchema>;

export const invitationCreatedSchema = invitationSchema.extend({
  inviteUrl: z.string().url(),
});
export type InvitationCreatedResponse = z.infer<typeof invitationCreatedSchema>;

export const invitationListResponseSchema = z.object({
  items: z.array(invitationSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type InvitationListResponse = z.infer<typeof invitationListResponseSchema>;

export const publicInvitationSchema = z.object({
  email: z.string().email(),
  role: invitationRoleSchema,
  companyName: z.string(),
});
export type PublicInvitationResponse = z.infer<typeof publicInvitationSchema>;

export function parseInvitationCreated(data: unknown): InvitationCreatedResponse {
  return invitationCreatedSchema.parse(data);
}

export function parseInvitationList(data: unknown): InvitationListResponse {
  return invitationListResponseSchema.parse(data);
}

export function parsePublicInvitation(data: unknown): PublicInvitationResponse {
  return publicInvitationSchema.parse(data);
}
