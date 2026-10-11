import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSessionCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';
  
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfter}s` },
      { status: 429 }
    );
  }
  
  try {
    const { password } = await req.json();
    
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }
    
    const token = await createSession();
    console.log('[LOGIN] Token created, setting cookie');
    const res = NextResponse.json({ ok: true });
    const cookie = getSessionCookie(token);
    console.log('[LOGIN] Set-Cookie:', cookie);
    res.headers.set('Set-Cookie', cookie);
    return res;
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }
}