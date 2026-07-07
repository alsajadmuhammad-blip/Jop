
"use client";

import Link from "next/link";
import { Home, ShoppingCart, Store, User, Search, Shield, Phone, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
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

// عناصر خاصة بدور الشريك — الترتيب: يسار، وسط (دائري)، يمين
const repNavItems = [
  { href: WHATSAPP_CONTACT, icon: Phone, label: "تواصل", isCenter: false, external: true },
  { href: "/dashboard/representative", icon: Home, label: "الرئيسية", isCenter: true, external: false },
  { href: "/dashboard/representative", icon: User, label: "حسابي", isCenter: false, external: false },
];

// صفحات تخفي الـ bottom navbar (لها شريط إجراءات خاص بها)
const HIDE_ON_PATHS = ["/store/product"];

export function BottomNavbar() {
  const pathname = usePathname();
  const { items } = useCart();
  const { user, userRole } = useAuth();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const isGuest = !user;

  // أخفِ الـ navbar على صفحات المنتج لأن لديها أزرار إجراء خاصة
  if (HIDE_ON_PATHS.some(p => pathname?.startsWith(p))) return null;

  const getHref = (itemLabel: string) => {
    if (itemLabel === "الحساب") {
      if (!user) return "/login";
      if (userRole === "admin") return "/admin";
      if (userRole === "store") return "/dashboard/store";
      if (userRole === "representative") return "/dashboard/representative";
      return "/"; // Default for customer or other roles
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
      className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/70"
    >
      <Icon className="h-7 w-7 text-white" strokeWidth={2} />
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

  // ── شريط الشريك — مستقل تماماً ──
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
