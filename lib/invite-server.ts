import { parsePublicInvitation, type PublicInvitationResponse } from '@/lib/api/invitations';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export type InviteFetchResult =
  | { kind: 'ok'; invitation: PublicInvitationResponse }
  | { kind: 'invalid'; status: 404 | 410 }
  | { kind: 'error'; status: number };

export async function fetchInvitationByToken(token: string): Promise<InviteFetchResult> {
  const response = await fetch(`${baseURL}/invitations/by-token/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });

  if (response.status === 200) {
    const data = await response.json();
    return { kind: 'ok', invitation: parsePublicInvitation(data) };
  }

  if (response.status === 404 || response.status === 410) {
    return { kind: 'invalid', status: response.status };
  }

  return { kind: 'error', status: response.status };
}
