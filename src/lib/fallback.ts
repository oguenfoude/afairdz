export interface WatchModel {
  id: string;
  name: string;
  image: string;
  badge?: string;
  colorName?: string;
  description?: string;
  available: boolean;
  order: number;
}

export interface PackageOffer {
  quantity: number;
  title: string;
  pricePerUnit: number;
  totalPrice: number;
  originalTotal: number;
  savings: number;
  bonus: string;
}

export const FALLBACK_MODELS: WatchModel[] = [
  { id: 'm1', name: 'الموديل 1', image: '/images/products/hm-01.webp', colorName: 'أسود', available: true, order: 1 },
  { id: 'm2', name: 'الموديل 2', image: '/images/products/hm-02.webp', colorName: 'أسود', available: true, order: 2 },
];

export const FALLBACK_PACKAGES: PackageOffer[] = [
  { quantity: 1, title: '1 ساعة', pricePerUnit: 1500, totalPrice: 1500, originalTotal: 3000, savings: 1500, bonus: '1500 دج' },
  { quantity: 2, title: '2 ساعات', pricePerUnit: 1400, totalPrice: 2800, originalTotal: 6000, savings: 3200, bonus: '2800 دج (توفير 200 دج)' },
  { quantity: 3, title: '3 ساعات', pricePerUnit: 1300, totalPrice: 3900, originalTotal: 9000, savings: 5100, bonus: '3900 دج (توفير 600 دج)' },
];

export interface FeeOverride {
  wilayaId: number;
  communeId?: number;
  home?: number;
  office?: number;
}

export const FALLBACK_FEES: FeeOverride[] = [];

export const FALLBACK_SETTINGS = {
  notices: '',
};