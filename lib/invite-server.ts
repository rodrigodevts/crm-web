import type { PublicInvitationDto } from '@/lib/generated/types/PublicInvitationDto';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export type InviteFetchResult =
  | { kind: 'ok'; invitation: PublicInvitationDto }
  | { kind: 'invalid'; status: 404 | 410 }
  | { kind: 'error'; status: number };

export async function fetchInvitationByToken(token: string): Promise<InviteFetchResult> {
  const response = await fetch(
    `${baseURL}/api/v1/invitations/by-token/${encodeURIComponent(token)}`,
    {
      cache: 'no-store',
    },
  );

  if (response.status === 200) {
    const data = (await response.json()) as PublicInvitationDto;
    return { kind: 'ok', invitation: data };
  }

  if (response.status === 404 || response.status === 410) {
    return { kind: 'invalid', status: response.status };
  }

  return { kind: 'error', status: response.status };
}
