"use client";

import { Suspense } from "react";
import { CartProvider } from "@/components/cart/cart-provider";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/hooks/use-auth";
import { BottomNavbar } from "@/components/layout/bottom-navbar";
import PwaInstall from "@/components/pwa-install";
import PushNotificationPrompt from "@/components/push-notification-prompt";
import { ThemeProvider } from "next-themes";
import { NavProgress } from "@/components/nav-progress";
import { StoreContactProvider } from "@/contexts/store-contact-context";

/* ─── غلاف الصفحة ─── */
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{ paddingTop: 'var(--header-h, 56px)' }}
      className="flex-1 min-w-0 pb-28 md:pb-0"
    >
      {children}
    </main>
  );
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
        <StoreContactProvider>
        <CartProvider>
          <div className="flex min-h-screen min-w-0 flex-col bg-background text-foreground overflow-x-hidden">
            {/* شريط تقدم التنقل — داخل Suspense لأنه يستخدم useSearchParams */}
            <Suspense fallback={null}>
              <NavProgress />
            </Suspense>

            <Header />

            <PageWrapper>
              {children}
            </PageWrapper>

            <BottomNavbar />
            <PwaInstall />
            <PushNotificationPrompt />
          </div>
        </CartProvider>
        </StoreContactProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
