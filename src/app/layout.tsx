import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import FacebookPixel from "@/components/FacebookPixel";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#064e3b",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://affaire-dz.com"),
  title: "BS Montres | طقم الساعة الملكية الفاخرة 2900 دج",
  description: "عرض حصري من BS Montres: طقم ساعة رجالية فاخرة بمينا أزرق ملكي + سوار التاج + خاتم ستانلس أنيق داخل علبة إهداء بـ 2900 دج فقط. توصيل لـ 58 ولاية والدفع بعد المعاينة عند الاستلام.",
  keywords: "BS Montres, بي اس مونتر, ساعات رجالية الجزائر, طقم ساعة ملكية, سوار التاج, ساعة 2900 دج, توصيل 58 ولاية, الدفع عند الاستلام",
  icons: {
    icon: "/images/products/set-blue-01.jpg",
    shortcut: "/images/products/set-blue-01.jpg",
    apple: "/images/products/set-blue-01.jpg",
  },
  openGraph: {
    title: "BS Montres | طقم الساعة الملكية الفاخرة بـ 2900 دج",
    description: "طقم ساعة رجالية فاخرة بمينا أزرق ملكي + خاتم ستانلس + سوار التاج داخل علبة إهداء فاخرة بـ 2900 دج فقط من BS Montres. توصيل 58 ولاية والدفع عند الاستلام بعد المعاينة.",
    siteName: "BS Montres",
    images: [
      {
        url: "/images/products/set-blue-01.jpg",
        width: 800,
        height: 800,
        alt: "BS Montres - طقم الساعة الملكية الفاخرة"
      }
    ],
    locale: "ar_DZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BS Montres | طقم الساعة الملكية الفاخرة بـ 2900 دج",
    description: "ساعة كوارتز فاخرة بمينا أزرق ملكي + خاتم وسوار التاج داخل علبة بـ 2900 دج فقط من BS Montres. الدفع عند الاستلام.",
    images: ["/images/products/set-blue-01.jpg"],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="preconnect" href="https://i.imgur.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i.imgur.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
      </head>
      <body className="font-sans bg-slate-50 text-slate-900 antialiased selection:bg-[#222355] selection:text-white">
        <FacebookPixel />
        {children}
      </body>
    </html>
  );
}
