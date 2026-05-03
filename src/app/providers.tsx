
"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/components/cart/cart-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
                <div className="flex min-h-screen flex-col bg-background text-foreground">
                  <Header />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <BottomNavbar />
                  <PwaInstall />
                </div>
              </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}
