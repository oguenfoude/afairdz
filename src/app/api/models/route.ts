import { getAvailableModels } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const models = await getAvailableModels();
  return Response.json(models, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}