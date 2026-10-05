export interface WatchModel {
  id: number;
  name: string;
  image: string;
  badge?: string;
  colorName?: string;
  description?: string;
  /** false = out of stock, hidden from gallery/dropdown but kept for order history */
  available?: boolean;
}

export const WATCH_MODELS: WatchModel[] = [
  { id: 1, name: "الموديل 1", image: "/images/products/19.jpg" },
  { id: 2, name: "الموديل 2", image: "/images/products/20.jpg" },
  { id: 3, name: "الموديل 3", image: "/images/products/21.jpg", available: false },
  { id: 4, name: "الموديل 4", image: "/images/products/7.webp" },
  { id: 5, name: "الموديل 5", image: "/images/products/16.webp" },
  { id: 6, name: "الموديل 6", image: "/images/products/6.webp" },
  { id: 7, name: "الموديل 7", image: "/images/products/8.webp" },
  { id: 8, name: "الموديل 8", image: "/images/products/17.webp", available: false },
  { id: 9, name: "الموديل 9", image: "/images/products/18.webp" },
  { id: 10, name: "الموديل 10", image: "/images/products/1.webp" },
  { id: 11, name: "الموديل 11", image: "/images/products/22.jpg" },
  { id: 12, name: "الموديل 12", image: "/images/products/23.jpg" }
];

/** Models customers can currently order (out-of-stock hidden, history intact) */
export const AVAILABLE_MODELS: WatchModel[] = WATCH_MODELS.filter(m => m.available !== false);

export interface PackageOffer {
  quantity: number;
  title: string;
  pricePerUnit: number;
  totalPrice: number;
  originalTotal: number;
  savings: number;
  bonus: string;
}

export const PACKAGE_OFFERS: PackageOffer[] = [
  {
    quantity: 1,
    title: "1 ساعة",
    pricePerUnit: 1500,
    totalPrice: 1500,
    originalTotal: 3000,
    savings: 1500,
    bonus: "1500 دج"
  },
  {
    quantity: 2,
    title: "2 ساعات",
    pricePerUnit: 1400,
    totalPrice: 2800,
    originalTotal: 6000,
    savings: 3200,
    bonus: "2800 دج (توفير 200 دج)"
  },
  {
    quantity: 3,
    title: "3 ساعات",
    pricePerUnit: 1300,
    totalPrice: 3900,
    originalTotal: 9000,
    savings: 5100,
    bonus: "3900 دج (توفير 600 دج)"
  }
];
