import { NextRequest, NextResponse } from 'next/server';
import { getFeeOverrides, saveFeeOverrides } from '@/lib/data';
import type { FeeOverride } from '@/lib/fallback';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Partial<FeeOverride> & { wilayaId: number; communeId?: number };
    
    if (!body.wilayaId) {
      return NextResponse.json({ error: 'wilayaId مطلوب' }, { status: 400 });
    }
    
    const overrides = await getFeeOverrides();
    const key = `${body.wilayaId}-${body.communeId ?? 'default'}`;
    const idx = overrides.findIndex(o => 
      o.wilayaId === body.wilayaId && o.communeId === body.communeId
    );
    
    const updated: FeeOverride = {
      wilayaId: body.wilayaId,
      communeId: body.communeId,
      home: body.home,
      office: body.office,
    };
    
    if (idx >= 0) {
      overrides[idx] = updated;
    } else {
      overrides.push(updated);
    }
    
    await saveFeeOverrides(overrides);
    return NextResponse.json({ ok: true, overrides });
  } catch {
    return NextResponse.json({ error: 'فشل الحفظ' }, { status: 500 });
  }
}