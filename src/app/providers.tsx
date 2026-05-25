
"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/components/cart/cart-provider";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/hooks/use-auth";
import { BottomNavbar } from "@/components/layout/bottom-navbar";
import PwaInstall from '@/components/pwa-install';
import { ThemeProvider } from "next-themes";

function AppContent({ children }: { children: React.ReactNode }) {
  // ...existing code...
}


export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
              <CartProvider>
                <div className="flex min-h-screen min-w-0 flex-col bg-background text-foreground overflow-x-hidden">
                  <Header />
                  <main className="flex-1 min-w-0 pb-28 md:pb-0">
                    {children}
                  </main>
                  <BottomNavbar />
                  <PwaInstall />
                </div>
              </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}
