import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { uploadImage } from '@/lib/blob';
import { checkAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const guard = checkAdmin(req);
  if (guard) return guard;
  
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'ملف غير صالح' }, { status: 400 });
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'الملف كبير جداً (الحد 5MB)' }, { status: 400 });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 78 })
      .toBuffer();
    
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const url = await uploadImage(new File([webpBuffer], filename, { type: 'image/webp' }), filename);
    
    return NextResponse.json({ url, filename });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: 'فشل الرفع' }, { status: 500 });
  }
}