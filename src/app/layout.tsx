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
  minimumScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)',  color: '#2563eb' },
  ],
};

export const metadata: Metadata = {
  title: 'MARKAZI',
  description: '',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'MARKAZI',
    description: '',
    siteName: 'MARKAZI',
  },
  twitter: {
    title: 'MARKAZI',
    description: '',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MARKAZI',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'MARKAZI',
    'application-name': 'MARKAZI',
    'msapplication-TileColor': '#2563eb',
    'msapplication-tap-highlight': 'no',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* iOS: hide address bar & extend content under status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Android: prevent tap highlight */}
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
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
