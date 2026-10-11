import { put, del, list } from '@vercel/blob';

const MODELS_KEY = 'models.json';
const FEES_KEY = 'fees-overrides.json';
const SETTINGS_KEY = 'settings.json';

export async function getBlobJson<T>(key: string, fallback: T): Promise<T> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fallback;
  try {
    // Newest family version wins (writes are timestamped, see putBlobJson)
    const fam = await listFamily(key);
    if (fam.length === 0) return fallback;
    const newest = [...fam].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];
    const sep = newest.url.includes('?') ? '&' : '?';
    const res = await fetch(`${newest.url}${sep}v=${Date.now()}`, { cache: 'no-store' });
    return res.ok ? res.json() : fallback;
  } catch {
    return fallback;
  }
}

function friendlyBlobError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('No blob credentials') || msg.includes('BLOB_READ_WRITE_TOKEN')) {
    return new Error('BLOB_NO_TOKEN: أضف BLOB_READ_WRITE_TOKEN في Vercel ثم أعد النشر');
  }
  if (msg.toLowerCase().includes('private')) {
    return new Error('BLOB_PRIVATE_STORE: متجر Blob خاص — اجعله Public من Vercel (Storage → Blob → Settings) أو أنشئ متجراً عاماً جديداً وحدّث التوكن');
  }
  return e instanceof Error ? e : new Error(msg);
}

/**
 * Versioned writes: same-path overwrites are eventually consistent on reads,
 * so every save gets a unique timestamped name (`<base>-<ts>.json`).
 * A version family = the legacy exact file + all `<base>-*.json` files
 * (uploads live under `models/*.webp` and never match: `.json` filter).
 * Reads always pick the newest family member by uploadedAt.
 */
function familyBase(key: string) {
  return key.replace(/\.json$/, '');
}

function isFamilyMember(key: string, pathname: string) {
  if (pathname === key) return true;
  const base = familyBase(key);
  return pathname.startsWith(base + '-') && pathname.endsWith('.json');
}

export async function listFamily(key: string) {
  const { blobs } = await list({ prefix: familyBase(key), limit: 100 });
  return blobs.filter(b => isFamilyMember(key, b.pathname));
}

export async function putBlobJson(key: string, data: unknown) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_NO_TOKEN: أضف BLOB_READ_WRITE_TOKEN في Vercel ثم أعد النشر');
  try {
    const stamped = `${familyBase(key)}-${Date.now()}.json`;
    const blob = await put(stamped, JSON.stringify(data, null, 2), {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json',
    });
    // Best-effort cleanup of previous versions (including legacy same-path file)
    try {
      const fam = await listFamily(key);
      await Promise.all(
        fam
          .filter(b => b.url !== blob.url)
          .map(b => del(b.url).catch(() => {}))
      );
    } catch { /* cleanup failure is harmless */ }
    return blob.url;
  } catch (e) {
    throw friendlyBlobError(e);
  }
}

export async function uploadImage(file: File, filename: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_NO_TOKEN: أضف BLOB_READ_WRITE_TOKEN في Vercel ثم أعد النشر');
  try {
    const buffer = await file.arrayBuffer();
    const blob = await put(`models/${filename}`, Buffer.from(buffer), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'image/webp',
    });
    return blob.url;
  } catch (e) {
    throw friendlyBlobError(e);
  }
}

/** Real writability probe: writes then deletes a tiny file, no junk left behind */
export async function probeBlobWrite(): Promise<{ writable: boolean; reason?: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { writable: false, reason: 'no-token' };
  const key = 'health-probe.json';
  try {
    await put(key, JSON.stringify({ ok: 1 }), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    try { await del(key); } catch { /* probe file may linger, harmless */ }
    return { writable: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('private')) return { writable: false, reason: 'private-store' };
    return { writable: false, reason: 'unreachable' };
  }
}

export async function deleteImage(filename: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(`models/${filename}`);
}

export { MODELS_KEY, FEES_KEY, SETTINGS_KEY };