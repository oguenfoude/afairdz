import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, getTokenFromCookie, clearSessionCookie } from '@/lib/auth';

const ADMIN_PATHS = ['/admin', '/api/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));
  if (!isAdminPath) return NextResponse.next();
  
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }
  
  const token = getTokenFromCookie(req.headers.get('cookie'));
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  
  const isValid = await verifySession(token);
  if (!isValid) {
    const res = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      : NextResponse.redirect(new URL('/admin/login', req.url));
    res.headers.set('Set-Cookie', clearSessionCookie());
    return res;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};