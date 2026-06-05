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
    icon: 'https://i.ibb.co/JRWx4h0N/20260426-060854.png',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="https://i.ibb.co/JRWx4h0N/20260426-060854.png" />
        <link rel="apple-touch-icon" href="https://i.ibb.co/JRWx4h0N/20260426-060854.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>
      <body
        className={cn(
          "font-body antialiased overflow-x-hidden"
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
