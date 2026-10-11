import { put, del, list } from '@vercel/blob';

const MODELS_KEY = 'models.json';
const FEES_KEY = 'fees-overrides.json';
const SETTINGS_KEY = 'settings.json';

export async function getBlobJson<T>(key: string, fallback: T): Promise<T> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fallback;
  try {
    const { blobs } = await list({ prefix: key, limit: 1 });
    if (blobs.length === 0) return fallback;
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    return res.ok ? res.json() : fallback;
  } catch {
    return fallback;
  }
}

export async function putBlobJson(key: string, data: unknown) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN not set');
  const blob = await put(key, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
  return blob.url;
}

export async function uploadImage(file: File, filename: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN not set');
  const buffer = await file.arrayBuffer();
  const blob = await put(`models/${filename}`, Buffer.from(buffer), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'image/webp',
  });
  return blob.url;
}

export async function deleteImage(filename: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(`models/${filename}`);
}

export { MODELS_KEY, FEES_KEY, SETTINGS_KEY };