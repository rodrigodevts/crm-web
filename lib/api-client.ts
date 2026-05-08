import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
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

    if (status === 403 && typeof window !== 'undefined') {
      // Backend negou por permissão. Toast genérico — UI condicional cobre os
      // caminhos esperados; isto pega chamadas que escaparam (ex.: AGENT
      // navegando direto pra rota admin antes do gate server redirecionar).
      toast.error('Você não tem permissão para essa ação.');
    }

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
