import { NextRequest, NextResponse } from 'next/server';
import { sendMetaCapiEvent } from '@/lib/metaCapi';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientIpAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0';
    const clientUserAgent = req.headers.get('user-agent') || '';

    const res = await sendMetaCapiEvent({
      ...body,
      userData: {
        ...body.userData,
        clientIpAddress: body.userData?.clientIpAddress || clientIpAddress,
        clientUserAgent: body.userData?.clientUserAgent || clientUserAgent,
      },
    });

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (err) {
    console.error('[CAPI Route] Error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
