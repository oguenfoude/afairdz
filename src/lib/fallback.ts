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
  { 
    id: 'm1', 
    name: 'طقم الساعة الملكية الفاخرة (أزرق ملكي)', 
    image: '/images/products/set-blue-01.jpg', 
    badge: 'الأكثر طلباً',
    colorName: 'أزرق ملكي + فضي',
    description: 'طقم ساعة رجالية فاخرة بمينا أزرق ملكي وإطار مسنن + سوار التاج الملكي + خاتم ستانلس مخطط داخل علبة إهداء فاخرة',
    available: true, 
    order: 1 
  },
];

export const PRODUCT_GALLERY_IMAGES = [
  { id: 1, src: '/images/products/set-blue-01.jpg', label: 'صورة كاملة للطقم' },
  { id: 2, src: '/images/products/set-blue-02.jpg', label: 'زاوية جانبية مقربة' },
  { id: 3, src: '/images/products/set-blue-03.jpg', label: 'داخل علبة الإهداء' },
];

export const FALLBACK_PACKAGES: PackageOffer[] = [
  { quantity: 1, title: 'طقم واحد كامل', pricePerUnit: 2900, totalPrice: 2900, originalTotal: 5800, savings: 2900, bonus: '2900 دج' },
  { quantity: 2, title: '2 أطقم كاملة', pricePerUnit: 2700, totalPrice: 5400, originalTotal: 11600, savings: 6200, bonus: '5400 دج (توفير 400 دج)' },
  { quantity: 3, title: '3 أطقم كاملة', pricePerUnit: 2500, totalPrice: 7500, originalTotal: 17400, savings: 9900, bonus: '7500 دج (توفير 1200 دج)' },
];

export interface FeeOverride {
  wilayaId: number;
  communeId?: number;
  home?: number;
  office?: number;
}

export const FALLBACK_FEES: FeeOverride[] = [];

export const FALLBACK_SETTINGS = {
  notices: 'تخفيض حصري: 2900 دج فقط لفترة محدودة — توصيل لـ 58 ولاية والدفع بعد المعاينة عند الاستلام',
};