
"use client";

import Link from "next/link";
import { Home, ShoppingCart, Store, User, Search, Shield, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CartSheet } from "../cart/cart-sheet";

const navItems = [
  { href: "/search", icon: Search, label: "البحث", roles: ["customer", "store", "representative"] },
  { href: "/stores", icon: Store, label: "المتاجر", roles: ["customer", "store", "representative"] },
  { href: "/", icon: Home, label: "الرئيسية", isCenter: true, roles: ["customer", "store", "representative"] },
  { href: "/cart", icon: ShoppingCart, label: "السلة", roles: ["customer", "store", "representative"] },
  { href: "/admin", icon: Shield, label: "الإدارة", roles: ["admin"], isCenter: true },
  { href: "/login", icon: User, label: "الحساب", roles: ["customer", "store", "representative", "admin"] },
];

export function BottomNavbar() {
  const pathname = usePathname();
  const { items } = useCart();
  const { user, userRole } = useAuth();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const isGuest = !user;

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
