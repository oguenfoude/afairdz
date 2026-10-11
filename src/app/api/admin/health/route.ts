import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/adminGuard';
import { probeBlobWrite } from '@/lib/blob';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = checkAdmin(req);
  if (guard) return guard;
  const probe = await probeBlobWrite();
  return NextResponse.json({
    ok: true,
    blob: probe.writable,
    blobReason: probe.reason ?? null,
    password: Boolean(process.env.ADMIN_PASSWORD),
  });
}
