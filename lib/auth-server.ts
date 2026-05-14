import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchCurrentUser(cookieHeader: string): Promise<UserResponseDto | null> {
  const response = await fetch(`${baseURL}/api/v1/me`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch /me: ${response.status}`);
  }

  return (await response.json()) as UserResponseDto;
}

export async function getCurrentUserOnServer(): Promise<UserResponseDto | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  return fetchCurrentUser(cookieHeader);
}
