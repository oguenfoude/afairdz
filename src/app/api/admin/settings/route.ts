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
  } catch {
    return NextResponse.json({ error: 'فشل الحفظ' }, { status: 500 });
  }
}