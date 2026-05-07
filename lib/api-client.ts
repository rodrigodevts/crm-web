import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
// Import dinâmico via require() pra evitar dependência circular em testes
// (a chamada acontece dentro do interceptor, não no top-level).
import type { authControllerRefresh as AuthControllerRefreshFn } from '@/lib/generated/client/authControllerRefresh';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

let _authControllerRefresh: typeof AuthControllerRefreshFn | null = null;
async function getAuthControllerRefresh(): Promise<typeof AuthControllerRefreshFn> {
  if (!_authControllerRefresh) {
    const mod = await import('@/lib/generated/client/authControllerRefresh');
    _authControllerRefresh = mod.authControllerRefresh;
  }
  return _authControllerRefresh;
}

let inFlightRefresh: Promise<void> | null = null;

async function performRefresh(): Promise<void> {
  if (inFlightRefresh) return inFlightRefresh;

  // Passar o próprio apiClient pra que o cookie `refresh_token` seja enviado.
  // O interceptor abaixo detecta pela URL que essa é a chamada de refresh
  // e evita loop infinito caso ela mesma retorne 401.
  inFlightRefresh = (async () => {
    const refresh = await getAuthControllerRefresh();
    await refresh({}, { client: apiClient });
  })().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const isRefreshCall = originalRequest.url?.includes('/auth/refresh');
    if (isRefreshCall) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await performRefresh();
      return apiClient.request(originalRequest);
    } catch (refreshError) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    }
  },
);

export const apiClientConfig = { client: apiClient };
