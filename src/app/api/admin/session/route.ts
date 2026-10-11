import { NextResponse, NextRequest } from 'next/server';
import { verifySession, getTokenFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = getTokenFromCookie(req.headers.get('cookie'));
  const valid = token ? await verifySession(token) : false;
  return NextResponse.json({ authenticated: valid });
}