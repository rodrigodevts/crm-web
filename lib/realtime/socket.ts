import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Cria um socket novo para a tela debug. Sem singleton global (escopo da
 * tela). Namespace/path default. `withCredentials: true` envia o cookie
 * httpOnly `access_token` no handshake — o backend autentica e auto-joina
 * a sala `company:{companyId}:tickets` a partir do JWT. O cliente NUNCA
 * envia companyId. Reconexão default do socket.io ligada.
 */
export function createSocket(): Socket {
  return io(API_URL, { withCredentials: true });
}
