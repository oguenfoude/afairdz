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
  { id: 'm1', name: 'الموديل 1', image: '/images/products/tg-01.webp', available: true, order: 1 },
  { id: 'm2', name: 'الموديل 2', image: '/images/products/tg-02.webp', available: true, order: 2 },
  { id: 'm3', name: 'الموديل 3', image: '/images/products/tg-03.webp', available: true, order: 3 },
  { id: 'm4', name: 'الموديل 4', image: '/images/products/tg-04.webp', available: true, order: 4 },
  { id: 'm5', name: 'الموديل 5', image: '/images/products/tg-05.webp', available: true, order: 5 },
  { id: 'm6', name: 'الموديل 6', image: '/images/products/tg-06.webp', available: true, order: 6 },
  { id: 'm7', name: 'الموديل 7', image: '/images/products/tg-07.webp', available: true, order: 7 },
  { id: 'm8', name: 'الموديل 8', image: '/images/products/tg-08.webp', available: true, order: 8 },
  { id: 'm9', name: 'الموديل 9', image: '/images/products/tg-09.webp', available: true, order: 9 },
  { id: 'm10', name: 'الموديل 10', image: '/images/products/tg-10.webp', available: true, order: 10 },
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