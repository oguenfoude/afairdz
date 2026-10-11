import { getFeeOverrides } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const overrides = await getFeeOverrides();
  return Response.json(overrides, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
