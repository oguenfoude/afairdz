import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/adminGuard';
import { listBlocked, unblockPhone } from '@/lib/phoneGuard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = checkAdmin(req);
  if (guard) return guard;
  const blocked = await listBlocked();
  return NextResponse.json(blocked);
}

export async function DELETE(req: NextRequest) {
  const guard = checkAdmin(req);
  if (guard) return guard;
  try {
    const { phone } = await req.json();
    const clean = String(phone || '').trim().replace(/[\s\-]/g, '');
    if (!clean) return NextResponse.json({ error: 'رقم غير صالح' }, { status: 400 });
    const ok = await unblockPhone(clean);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'فشل إلغاء الحظر' }, { status: 500 });
  }
}
