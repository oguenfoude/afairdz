import { getBlobJson, putBlobJson, MODELS_KEY, FEES_KEY, SETTINGS_KEY } from './blob';
import { FALLBACK_MODELS, FALLBACK_PACKAGES, FALLBACK_FEES, FALLBACK_SETTINGS, type WatchModel, type PackageOffer, type FeeOverride } from './fallback';
import { revalidatePath } from 'next/cache';

export async function getModels(): Promise<WatchModel[]> {
  return getBlobJson<WatchModel[]>(MODELS_KEY, FALLBACK_MODELS);
}

export async function getAvailableModels(): Promise<WatchModel[]> {
  const models = await getModels();
  return models.filter(m => m.available).sort((a, b) => a.order - b.order);
}

export async function saveModels(models: WatchModel[]) {
  await putBlobJson(MODELS_KEY, models);
  revalidatePath('/', 'page');
}

export async function getPackages(): Promise<PackageOffer[]> {
  const settings = await getBlobJson<{ packages?: PackageOffer[]; notices?: string }>(SETTINGS_KEY, FALLBACK_SETTINGS);
  return settings.packages ?? FALLBACK_PACKAGES;
}

export async function savePackages(packages: PackageOffer[]) {
  const settings = await getBlobJson<{ packages?: PackageOffer[]; notices?: string }>(SETTINGS_KEY, FALLBACK_SETTINGS);
  await putBlobJson(SETTINGS_KEY, { ...settings, packages });
  revalidatePath('/', 'page');
}

export async function getFeeOverrides(): Promise<FeeOverride[]> {
  return getBlobJson<FeeOverride[]>(FEES_KEY, FALLBACK_FEES);
}

export async function saveFeeOverrides(overrides: FeeOverride[]) {
  await putBlobJson(FEES_KEY, overrides);
  revalidatePath('/', 'page');
}

export async function getSettings() {
  return getBlobJson<{ packages?: PackageOffer[]; notices?: string }>(SETTINGS_KEY, FALLBACK_SETTINGS);
}

export async function saveSettings(settings: Record<string, unknown>) {
  await putBlobJson(SETTINGS_KEY, settings);
  revalidatePath('/', 'page');
}