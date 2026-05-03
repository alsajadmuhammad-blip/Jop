import React from 'react';
import Head from 'next/head';
import type { Metadata } from 'next'
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";



export const metadata: Metadata = {
  title: 'مركزي - منصة المتاجر المتكاملة',
  description: 'منصة مركزية لإدارة المتاجر والصيدليات مع تجربة تشغيل بسيطة وواضحة.',
  icons: {
    icon: '/icons/logo-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // PWA install handled by a client component (`PwaInstall`).
  // Server components must not use client-side hooks like `useState` or `useEffect`.
  // The `PwaInstall` component mounts on the client and handles the install prompt.

  return (
    <html lang="ar" dir="rtl">
      <Head>
        <meta name="theme-color" content="#2563eb" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>
      <body
        className={cn(
          "font-body antialiased"
        )}
      >
        <AppProviders>
            {children}
        </AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
