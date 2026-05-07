import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

function makeRequest(pathname: string, hasCookie: boolean): NextRequest {
  const url = new URL(`http://localhost${pathname}`);
  const headers = new Headers();
  if (hasCookie) {
    headers.set('cookie', 'access_token=abc');
  }
  return new NextRequest(url, { headers });
}

describe('proxy', () => {
  it.each(['/login', '/aceitar-convite', '/aceitar-convite/abc-123-token'])(
    'permite acesso público a %s sem cookie',
    (path) => {
      const response = proxy(makeRequest(path, false));
      expect(response.headers.get('location')).toBeNull();
    },
  );

  it('redireciona para /login em rota privada sem cookie', () => {
    const response = proxy(makeRequest('/atendimentos', false));
    expect(response.headers.get('location')).toContain('/login');
  });

  it('deixa passar em rota privada com cookie de acesso', () => {
    const response = proxy(makeRequest('/atendimentos', true));
    expect(response.headers.get('location')).toBeNull();
  });
});
