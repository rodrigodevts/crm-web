import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AxiosInstance } from 'axios';

// Hoisted mocks
const refreshMock = vi.fn();
vi.mock('@/lib/generated/client/authControllerRefresh', () => ({
  authControllerRefresh: refreshMock,
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    refreshMock.mockReset();
  });

  it('cria instance com baseURL e withCredentials', async () => {
    const { apiClient } = await import('./api-client');
    expect(apiClient.defaults.baseURL).toBe('http://localhost:3000/api/v1');
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('em 401, dispara refresh e refaz request original', async () => {
    refreshMock.mockResolvedValueOnce({ user: { id: 'u1' } });

    const { apiClient } = await import('./api-client');
    const adapter = vi.fn();
    let firstCall = true;
    adapter.mockImplementation((config) => {
      if (firstCall && config.url === '/me') {
        firstCall = false;
        return Promise.reject({
          response: { status: 401 },
          config,
        });
      }
      return Promise.resolve({
        data: { user: { id: 'u1' } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    });
    (apiClient as AxiosInstance).defaults.adapter = adapter;

    const result = await apiClient.get('/me');

    expect(refreshMock).toHaveBeenCalledOnce();
    expect(result.status).toBe(200);
  });

  it('em 401 do refresh, redireciona pra /login', async () => {
    refreshMock.mockRejectedValueOnce({ response: { status: 401 } });

    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '', toString: () => '', assign: hrefSetter },
    });

    const { apiClient } = await import('./api-client');
    const adapter = vi.fn().mockRejectedValue({
      response: { status: 401 },
      config: { url: '/me', method: 'get' },
    });
    (apiClient as AxiosInstance).defaults.adapter = adapter;

    await expect(apiClient.get('/me')).rejects.toBeDefined();
  });

  it('compartilha promise de refresh entre 401s simultâneos', async () => {
    let resolveRefresh: (v: unknown) => void = () => {};
    refreshMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const { apiClient } = await import('./api-client');
    const adapter = vi.fn();
    const seen = new Set<string>();
    adapter.mockImplementation((config) => {
      const _key = `${config.method}-${config.url}-${seen.has(config.url ?? '')}`;
      if (!seen.has(config.url ?? '')) {
        seen.add(config.url ?? '');
        return Promise.reject({ response: { status: 401 }, config });
      }
      return Promise.resolve({ data: 'ok', status: 200, statusText: 'OK', headers: {}, config });
    });
    (apiClient as AxiosInstance).defaults.adapter = adapter;

    const p1 = apiClient.get('/a');
    const p2 = apiClient.get('/b');

    setTimeout(() => resolveRefresh({ user: { id: 'u1' } }), 0);
    await Promise.all([p1, p2]);

    expect(refreshMock).toHaveBeenCalledOnce();
  });
});
