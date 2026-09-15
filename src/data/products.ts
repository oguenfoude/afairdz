export interface WatchModel {
  id: number;
  name: string;
  image: string;
  badge?: string;
  colorName?: string;
  description?: string;
}

export const WATCH_MODELS: WatchModel[] = [
  { id: 1, name: "الموديل 1", image: "/images/products/1.webp" },
  { id: 2, name: "الموديل 2", image: "/images/products/2.webp" },
  { id: 3, name: "الموديل 3", image: "/images/products/5.webp" },
  { id: 4, name: "الموديل 4", image: "/images/products/6.webp" },
  { id: 5, name: "الموديل 5", image: "/images/products/9.webp" },
  { id: 6, name: "الموديل 6", image: "/images/products/10.webp" },
  { id: 7, name: "الموديل 7", image: "/images/products/12.webp" },
  { id: 8, name: "الموديل 8", image: "/images/products/14.webp" },
  { id: 9, name: "الموديل 9", image: "/images/products/15.webp" },
  { id: 10, name: "الموديل 10", image: "/images/products/16.webp" }
];

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
