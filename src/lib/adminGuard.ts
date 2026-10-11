import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = process.env.ADMIN_PASSWORD!;

export function checkAdmin(req: NextRequest) {
  const sent = req.headers.get('x-admin-password');
  if (!sent || sent !== PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}