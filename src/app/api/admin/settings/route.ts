import { NextRequest, NextResponse } from 'next/server';
import { saveSettings, savePackages } from '@/lib/data';
import type { PackageOffer } from '@/lib/fallback';

export async function PUT(req: NextRequest) {
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