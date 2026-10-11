import { NextRequest, NextResponse } from 'next/server';
import { saveModels, getModels } from '@/lib/data';
import type { WatchModel } from '@/lib/fallback';

export async function PUT(req: NextRequest) {
  try {
    const models = await req.json() as WatchModel[];
    
    if (!Array.isArray(models)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    
    const validated = models.map((m, i) => ({
      id: m.id || `m${Date.now()}-${i}`,
      name: m.name?.trim() || `الموديل ${i + 1}`,
      image: m.image?.trim() || '/images/products/20.webp',
      badge: m.badge?.trim(),
      colorName: m.colorName?.trim(),
      description: m.description?.trim(),
      available: m.available !== false,
      order: typeof m.order === 'number' ? m.order : i + 1,
    }));
    
    await saveModels(validated);
    return NextResponse.json({ ok: true, models: validated });
  } catch {
    return NextResponse.json({ error: 'فشل الحفظ' }, { status: 500 });
  }
}