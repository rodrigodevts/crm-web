import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const POST_AUTH_HOME = '/atendimentos';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const accessToken = request.cookies.get('access_token');

  if (isPublic) {
    if (accessToken) {
      return NextResponse.redirect(new URL(POST_AUTH_HOME, request.url));
    }
    return NextResponse.next();
  }

  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
