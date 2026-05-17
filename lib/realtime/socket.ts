import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Cria um socket novo (sem singleton; escopo da tela que o monta).
 * Namespace/path default. `withCredentials: true` envia o cookie httpOnly
 * `access_token` no handshake — o backend autentica e, a partir do JWT,
 * auto-joina as salas das gateways do namespace default:
 * `company:{companyId}:tickets` (mensagens) e
 * `company:{companyId}:channels` (status de canal). O cliente NUNCA envia
 * companyId. Reconexão default do socket.io ligada.
 */
export function createSocket(): Socket {
  return io(API_URL, { withCredentials: true });
}
