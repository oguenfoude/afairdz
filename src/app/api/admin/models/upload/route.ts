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
    const msg = e instanceof Error ? e.message : '';
    if (msg.startsWith('BLOB_NO_TOKEN') || msg.startsWith('BLOB_PRIVATE_STORE')) {
      return NextResponse.json({ error: msg.split(': ').slice(1).join(': ') }, { status: 500 });
    }
    if (msg.includes(' sharp') || msg.toLowerCase().includes('unsupported')) {
      return NextResponse.json({ error: 'صيغة الصورة غير مدعومة — استعمل JPG أو PNG أو WebP' }, { status: 400 });
    }
    return NextResponse.json({ error: 'فشل الرفع — حاول مرة أخرى' }, { status: 500 });
  }
}