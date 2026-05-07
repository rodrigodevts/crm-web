import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * Fetches the current authenticated user from the backend /me endpoint.
 * Passes the cookie header from the incoming request so the backend can
 * validate the session.
 *
 * Returns null on 401 (unauthenticated), throws on 5xx or network errors.
 */
export async function fetchCurrentUser(cookieHeader: string): Promise<UserResponseDto | null> {
  const response = await fetch(`${baseURL}/me`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch /me: ${response.status}`);
  }

  // JSON from a trusted backend endpoint — safe cast to the generated DTO type.
  return (await response.json()) as UserResponseDto;
}

/**
 * Server Component wrapper: reads cookies from the Next.js request context
 * and delegates to fetchCurrentUser.
 *
 * Only callable inside a Next.js Server Component or Server Action
 * (next/headers is not available in jsdom / unit tests).
 */
export async function getCurrentUserOnServer(): Promise<UserResponseDto | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  return fetchCurrentUser(cookieHeader);
}
