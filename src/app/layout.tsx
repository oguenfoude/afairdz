import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import FacebookPixel from "@/components/FacebookPixel";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#222355",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://affaire-dz.com"),
  title: "تخفيض من 300اف الى 150 الف لمدة 3ايام",
  description: "عرض حصري من Affaire DZ: ساعة كوارتز فاخرة + خاتم ستانلس + براسلي أنيق داخل علبة إهداء بـ 1500 دج فقط. توصيل لـ 58 ولاية والدفع بعد المعاينة عند الاستلام.",
  keywords: "Affaire DZ, ساعات رجالية الجزائر, طقم ساعة وخاتم وبراسلي, ساعة 1500 دج, توصيل 58 ولاية, الدفع عند الاستلام",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "تخفيض من 300اف الى 150 الف لمدة 3ايام",
    description: "عرض حصري من Affaire DZ: ساعة كوارتز أصلية + خاتم ستانلس + براسلي أنيق داخل علبة إهداء. توصيل 58 ولاية والدفع عند الاستلام بعد المعاينة.",
    siteName: "Affaire DZ",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 558,
        alt: "Affaire DZ Logo"
      },
      {
        url: "/images/products/1.webp",
        width: 800,
        height: 800,
        alt: "طقم ساعة يد رجالية - Affaire DZ"
      }
    ],
    locale: "ar_DZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "تخفيض من 300اف الى 150 الف لمدة 3ايام",
    description: "ساعة كوارتز فاخرة + خاتم وبراسلي داخل علبة بـ 1500 دج فقط. الدفع عند الاستلام.",
    images: ["/logo.png"],
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
      </head>
      <body className="font-sans bg-slate-50 text-slate-900 antialiased selection:bg-[#222355] selection:text-white">
        <FacebookPixel />
        {children}
      </body>
    </html>
  );
}
