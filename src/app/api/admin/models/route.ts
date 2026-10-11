import { NextRequest, NextResponse } from 'next/server';
import { getModels, saveModels } from '@/lib/data';
import type { WatchModel } from '@/lib/fallback';
import { checkAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const models = await getModels();
  return NextResponse.json(models);
}

export async function PUT(req: NextRequest) {
  const guard = checkAdmin(req);
  if (guard) return guard;
  
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.startsWith('BLOB_NO_TOKEN') || msg.startsWith('BLOB_PRIVATE_STORE')) {
      return NextResponse.json({ error: msg.split(': ').slice(1).join(': ') }, { status: 500 });
    }
    return NextResponse.json({ error: 'فشل الحفظ — حاول مرة أخرى' }, { status: 500 });
  }
}