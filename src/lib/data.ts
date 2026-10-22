import { FALLBACK_MODELS, FALLBACK_PACKAGES, FALLBACK_FEES, FALLBACK_SETTINGS, type WatchModel, type PackageOffer, type FeeOverride } from './fallback';

export async function getModels(): Promise<WatchModel[]> {
  return FALLBACK_MODELS;
}

export async function getAvailableModels(): Promise<WatchModel[]> {
  return FALLBACK_MODELS.filter(m => m.available).sort((a, b) => a.order - b.order);
}

export async function getPackages(): Promise<PackageOffer[]> {
  return FALLBACK_PACKAGES;
}

export async function getFeeOverrides(): Promise<FeeOverride[]> {
  return FALLBACK_FEES;
}

export async function getSettings() {
  return { packages: FALLBACK_PACKAGES, notices: FALLBACK_SETTINGS.notices ?? '' };
}
