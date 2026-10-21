import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { productMetadata } from "@/lib/product";
import "./globals.css";

// Self-hosted so builds never fetch from Google; files come from
// scripts/sync-fonts.ts.
const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
});

const urbanist = localFont({
  src: "./fonts/Urbanist-Variable.woff2",
  variable: "--font-urbanist",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Default for pages outside the (auth), (admin), and operator layouts, which
// pick the product themselves.
export const metadata: Metadata = productMetadata("forms");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${urbanist.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
