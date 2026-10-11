import { NextRequest, NextResponse } from 'next/server';
import { getFeeOverrides, saveFeeOverrides } from '@/lib/data';
import type { FeeOverride } from '@/lib/fallback';
import { checkAdmin } from '@/lib/adminGuard';

export async function GET() {
  const overrides = await getFeeOverrides();
  return NextResponse.json(overrides);
}

export async function PUT(req: NextRequest) {
  const guard = checkAdmin(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const list = Array.isArray(body) ? body : body.overrides;
    if (!Array.isArray(list)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    const validated: FeeOverride[] = list
      .filter(o => typeof o?.wilayaId === 'number')
      .map(o => ({
        wilayaId: o.wilayaId,
        communeId: typeof o.communeId === 'number' ? o.communeId : undefined,
        home: typeof o.home === 'number' ? o.home : undefined,
        office: typeof o.office === 'number' ? o.office : undefined,
      }))
      .filter(o => o.home !== undefined || o.office !== undefined);
    await saveFeeOverrides(validated);
    return NextResponse.json({ ok: true, overrides: validated });
  } catch {
    return NextResponse.json({ error: 'فشل الحفظ' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = checkAdmin(req);
  if (guard) return guard;
  
  try {
    const body = await req.json() as Partial<FeeOverride> & { wilayaId: number; communeId?: number };
    
    if (!body.wilayaId) {
      return NextResponse.json({ error: 'wilayaId مطلوب' }, { status: 400 });
    }
    
    const overrides = await getFeeOverrides();
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