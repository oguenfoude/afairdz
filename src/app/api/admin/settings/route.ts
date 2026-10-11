import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getPackages, saveSettings, savePackages } from '@/lib/data';
import type { PackageOffer } from '@/lib/fallback';
import { checkAdmin } from '@/lib/adminGuard';

export async function GET() {
  const [settings, packages] = await Promise.all([getSettings(), getPackages()]);
  return NextResponse.json({ ...settings, packages });
}

export async function PUT(req: NextRequest) {
  const guard = checkAdmin(req);
  if (guard) return guard;
  
  try {
    const body = await req.json();
    
    if (body.packages && Array.isArray(body.packages)) {
      await savePackages(body.packages);
    }
    
    const { packages, ...rest } = body;
    if (Object.keys(rest).length > 0) {
      await saveSettings(rest);
    }
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.startsWith('BLOB_NO_TOKEN') || msg.startsWith('BLOB_PRIVATE_STORE')) {
      return NextResponse.json({ error: msg.split(': ').slice(1).join(': ') }, { status: 500 });
    }
    return NextResponse.json({ error: 'فشل الحفظ — حاول مرة أخرى' }, { status: 500 });
  }
}