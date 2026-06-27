import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "./providers";
import SwRegister from "@/components/sw-register";
import "./globals.css";
import { cn } from "@/lib/utils";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: 'مركزي - منصة المتاجر المتكاملة',
  description: 'منصة مركزية لإدارة المتاجر والصيدليات مع تجربة تشغيل بسيطة وواضحة.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'مركزي',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cn('font-body antialiased overflow-x-hidden')}>
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
