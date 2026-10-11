import { NextResponse, NextRequest } from 'next/server';
import { verifySession, getTokenFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  console.log('[SESSION] Cookie header:', cookieHeader);
  const token = getTokenFromCookie(cookieHeader);
  console.log('[SESSION] Extracted token:', token ? 'present' : 'missing');
  const valid = token ? await verifySession(token) : false;
  console.log('[SESSION] Valid:', valid);
  return NextResponse.json({ authenticated: valid });
}