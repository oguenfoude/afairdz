import { getSettings, getPackages } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [settings, packages] = await Promise.all([getSettings(), getPackages()]);
  return Response.json(
    { notices: settings.notices ?? '', packages },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  );
}
