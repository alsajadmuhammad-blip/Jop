
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Home, ShoppingCart, Store, User, Search, Shield, Phone, MessageSquare, MapPin, Megaphone, Settings as SettingsIcon, type LucideIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useStoreContact } from "@/contexts/store-contact-context";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CartSheet } from "../cart/cart-sheet";

const WHATSAPP_CONTACT = "https://wa.me/9647772323607?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%20%D9%85%D8%B1%D9%83%D8%B2%D9%8A";

const navItems = [
  { href: "/search", icon: Search, label: "البحث", roles: ["customer", "store"] },
  { href: "/stores", icon: Store, label: "المتاجر", roles: ["customer", "store"] },
  { href: "/", icon: Home, label: "الرئيسية", isCenter: true, roles: ["customer", "store"] },
  { href: "/cart", icon: ShoppingCart, label: "السلة", roles: ["customer", "store"] },
  { href: "/admin", icon: Shield, label: "الإدارة", roles: ["admin"], isCenter: true },
  { href: "/login", icon: User, label: "الحساب", roles: ["customer", "store", "representative", "admin"] },
];

const repNavItems = [
  { href: WHATSAPP_CONTACT, icon: Phone, label: "تواصل", isCenter: false, external: true },
  { href: "/dashboard/representative", icon: Home, label: "الرئيسية", isCenter: true, external: false },
  { href: "/dashboard/representative", icon: User, label: "حسابي", isCenter: false, external: false },
];

const HIDE_ON_PATHS = ["/store/product"];

/* ─── شريط سفلي نظيف لصاحب المتجر — الأقسام الرئيسية الثلاثة ─── */
const STORE_OWNER_TABS = [
  { tab: "products", label: "المتجر", icon: Store, group: "store" as const },
  { tab: "flash", label: "التسويق", icon: Megaphone, group: "marketing" as const },
  { tab: "settings", label: "الإعدادات", icon: SettingsIcon, group: "settings" as const },
];

function storeOwnerTabGroup(tab: string | null) {
  if (!tab) return "store";
  if (["products", "orders", "pos", "inventory", "sections"].includes(tab)) return "store";
  if (["flash", "coupons"].includes(tab)) return "marketing";
  return "settings";
}

function StoreOwnerBottomTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeGroup =
    pathname === "/dashboard/store" ? storeOwnerTabGroup(searchParams.get("tab")) : null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="flex items-stretch">
        {STORE_OWNER_TABS.map(({ tab, label, icon: Icon, group }) => {
          const isActive = activeGroup === group;
          return (
            <Link
              key={tab}
              href={`/dashboard/store?tab=${tab}`}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
              {label}
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function renderStoreOwnerBar() {
  return (
    <Suspense fallback={null}>
      <StoreOwnerBottomTabs />
    </Suspense>
  );
}

export function BottomNavbar() {
  const pathname = usePathname();
  const { items } = useCart();
  const { user, userRole } = useAuth();
  const { contact } = useStoreContact();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const isGuest = !user;

  if (HIDE_ON_PATHS.some(p => pathname?.startsWith(p))) return null;

  /* هل نحن في صفحة متجر وعندنا بيانات تواصل؟ */
  const isStorePage = pathname?.startsWith("/store") && !pathname.startsWith("/store/product");
  const hasWA       = isStorePage && Boolean(contact.waHref);
  const hasMap      = isStorePage && Boolean(contact.mapsUrl);
  const hasContact  = hasWA || hasMap;

  const getHref = (itemLabel: string) => {
    if (itemLabel === "الحساب") {
      if (!user) return "/login";
      if (userRole === "admin") return "/admin";
      if (userRole === "store") return "/dashboard/store";
      if (userRole === "representative") return "/dashboard/representative";
      return "/";
    }
    if (itemLabel === "الرئيسية" && userRole === "store") {
      return "/dashboard/store";
    }
    return null;
  };

  const renderCircleButton = (Icon: LucideIcon, label: string, badgeCount?: number) => (
    <button
      type="button"
      aria-label={label}
      className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/70"
    >
      <Icon className="h-6 w-6 text-white" strokeWidth={2} />
      {badgeCount && badgeCount > 0 ? (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {badgeCount}
        </Badge>
      ) : null}
    </button>
  );

  const renderNavItem = (item: (typeof navItems)[0]) => {
    const customHref = getHref(item.label);
    const href = customHref || item.href;
    const isActive = pathname === href && !item.isCenter;
    const Icon = item.icon;

    if (item.label === 'السلة') {
      return (
        <CartSheet key="cart-sheet">
          {renderCircleButton(ShoppingCart, 'السلة', totalCartItems)}
        </CartSheet>
      );
    }

    if (item.isCenter) {
      return (
        <Link href={href} key={item.href} className="-mt-7 z-20 inline-flex">
          {renderCircleButton(Icon, item.label)}
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        href={href}
        className={cn(
          "relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors duration-200 text-muted-foreground",
          isActive && "text-primary"
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={2} />
        <span className="text-xs font-medium">{item.label}</span>
      </Link>
    );
  };

  /* ── شريط الشريك — مستقل تماماً ── */
  const renderRepNavbar = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-transparent z-50 flex justify-center">
      <div className="absolute bottom-4 mx-auto w-[calc(100%-2rem)] max-w-sm h-16 bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg border flex items-center justify-around">
        {repNavItems.map((item) => {
          const Icon = item.icon;
          if (item.isCenter) {
            return (
              <Link href={item.href} key={item.label} className="-mt-7 z-20 inline-flex">
                {renderCircleButton(Icon, item.label)}
              </Link>
            );
          }
          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground"
              >
                <Icon className="h-6 w-6" strokeWidth={2} />
                <span className="text-xs font-medium">{item.label}</span>
              </a>
            );
          }
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                isActive && "text-primary"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  if (userRole === 'representative') return renderRepNavbar();
  if (userRole === 'store') return renderStoreOwnerBar();

  /* ── شريط المتجر: إذا كان فيه بيانات تواصل، اعرضها بدل بعض الأزرار ── */
  if (hasContact) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-transparent z-50 flex justify-center">
        <div className="absolute bottom-4 mx-auto w-[calc(100%-2rem)] max-w-sm h-16 bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg border flex items-center justify-around px-2">

          {/* واتساب */}
          {hasWA && (
            <a
              href={contact.waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-emerald-600 transition-colors"
            >
              <MessageSquare className="h-6 w-6" strokeWidth={2} />
              <span className="text-xs font-semibold">واتساب</span>
            </a>
          )}

          {/* السلة — مركز دائري */}
          <div className="-mt-7 z-20 inline-flex">
            <CartSheet>
              {renderCircleButton(ShoppingCart, 'السلة', totalCartItems)}
            </CartSheet>
          </div>

          {/* الخريطة */}
          {hasMap && (
            <a
              href={contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-600 transition-colors"
            >
              <MapPin className="h-6 w-6" strokeWidth={2} />
              <span className="text-xs font-semibold">الخريطة</span>
            </a>
          )}

          {/* إذا ما فيه خريطة أو واتساب، نملأ بالحساب */}
          {!hasWA && !hasMap && (
            <Link
              href={!user ? "/login" : "/"}
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground"
            >
              <User className="h-6 w-6" strokeWidth={2} />
              <span className="text-xs font-medium">الحساب</span>
            </Link>
          )}

        </div>
      </div>
    );
  }

  const navItemsToRender = isGuest
    ? navItems.filter((item) => item.label === 'السلة')
    : userRole === 'store'
      ? navItems.filter((item) => item.label === 'الرئيسية')
      : navItems.filter((item) => item.roles.includes(userRole || 'customer'));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-transparent z-50 flex justify-center">
      <div className={cn(
        "absolute bottom-4 mx-auto w-[calc(100%-2rem)] max-w-sm h-16 bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg border flex items-center",
        isGuest ? 'justify-center' : 'justify-around'
      )}>
        {navItemsToRender.map(renderNavItem)}
      </div>
    </div>
  );
}
