import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchCurrentUser } from './auth-server';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';

const fakeUser: UserResponseDto = {
  id: '00000000-0000-7000-8000-000000000001',
  companyId: '00000000-0000-7000-8000-000000000002',
  name: 'Maria',
  email: 'maria@example.com',
  role: 'AGENT',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: null,
  departments: [],
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
};

describe('fetchCurrentUser', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna user em 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeUser,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchCurrentUser('access_token=abc; refresh_token=xyz');

    expect(result).toEqual(fakeUser);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ cookie: 'access_token=abc; refresh_token=xyz' }),
        cache: 'no-store',
      }),
    );
  });

  it('retorna null em 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }),
    );

    const result = await fetchCurrentUser('access_token=expired');

    expect(result).toBeNull();
  });

  it('throws em 5xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );

    await expect(fetchCurrentUser('access_token=abc')).rejects.toThrow(/500/);
  });

  it('throws em erro de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    await expect(fetchCurrentUser('access_token=abc')).rejects.toThrow(/ECONNREFUSED/);
  });
});
