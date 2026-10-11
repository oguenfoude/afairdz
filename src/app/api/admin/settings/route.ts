import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getPackages } from '@/lib/data';
import { putBlobJson, SETTINGS_KEY } from '@/lib/blob';
import type { PackageOffer } from '@/lib/fallback';
import { checkAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [settings, packages] = await Promise.all([getSettings(), getPackages()]);
  return NextResponse.json({ ...settings, packages });
}

export async function PUT(req: NextRequest) {
  const guard = checkAdmin(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    // Single atomic write: read once, merge, write once (two sequential puts race and wipe each other)
    const current = await getSettings();
    const merged: { packages?: PackageOffer[]; notices?: string } = { ...current };
    if (Array.isArray(body.packages)) merged.packages = body.packages as PackageOffer[];
    if (typeof body.notices === 'string') merged.notices = body.notices;
    await putBlobJson(SETTINGS_KEY, merged);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.startsWith('BLOB_NO_TOKEN') || msg.startsWith('BLOB_PRIVATE_STORE')) {
      return NextResponse.json({ error: msg.split(': ').slice(1).join(': ') }, { status: 500 });
    }
    return NextResponse.json({ error: 'فشل الحفظ — حاول مرة أخرى' }, { status: 500 });
  }
}