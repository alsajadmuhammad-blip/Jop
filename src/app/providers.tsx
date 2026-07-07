"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CartProvider } from "@/components/cart/cart-provider";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/hooks/use-auth";
import { BottomNavbar } from "@/components/layout/bottom-navbar";
import PwaInstall from "@/components/pwa-install";
import PushNotificationPrompt from "@/components/push-notification-prompt";
import { ThemeProvider } from "next-themes";
import { NavProgress } from "@/components/nav-progress";

/* ─── غلاف انتقال الصفحة ─── */
function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      style={{ paddingTop: 'var(--header-h, 56px)' }}
      className="flex-1 min-w-0 pb-28 md:pb-0"
    >
      {children}
    </motion.main>
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
      </AuthProvider>
    </ThemeProvider>
  );
}
