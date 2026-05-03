
"use client";

import Link from "next/link";
import { Home, ShoppingCart, Store, User, Search, Shield } from "lucide-react";
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

  const getHref = (itemLabel: string) => {
    if (itemLabel === "الحساب") {
      if (!user) return "/login";
      if (userRole === "admin") return "/admin";
      if (userRole === "store") return "/dashboard/store";
      if (userRole === "representative") return "/dashboard/representative";
      return "/"; // Default for customer or other roles
    }
    return null;
  };
  
  const renderNavItem = (item: (typeof navItems)[0]) => {
    const customHref = getHref(item.label);
    const href = customHref || item.href;
    const isActive = pathname === href && !item.isCenter;
    const Icon = item.icon;

    if (item.isCenter) {
      return (
        <Link href={href} key={item.href} className="-mt-7 z-10">
          <Button
            size="lg"
            className="rounded-full h-16 w-16 bg-primary shadow-lg text-primary-foreground flex items-center justify-center flex-col gap-1 transition-transform duration-300 hover:scale-110"
          >
            <Icon className="h-7 w-7" />
          </Button>
        </Link>
      );
    }
    
    const content = (
       <Link
          href={href}
          className={cn(
            "relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors duration-200 text-muted-foreground",
            isActive && "text-primary"
          )}
        >
          <Icon className="h-6 w-6" />
          <span className="text-xs font-medium">{item.label}</span>
          {item.label === "السلة" && totalCartItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute top-0 right-0 h-4 w-4 justify-center p-0 text-xs"
            >
              {totalCartItems}
            </Badge>
          )}
        </Link>
    );

    if (item.label === 'السلة') {
        return (
            <CartSheet key="cart-sheet">
                 <div
                  className={cn(
                    "relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors duration-200 text-muted-foreground",
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                  {totalCartItems > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute top-0 right-0 h-4 w-4 justify-center p-0 text-xs"
                    >
                      {totalCartItems}
                    </Badge>
                  )}
                </div>
            </CartSheet>
        );
    }


    return content;

  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-transparent z-50 flex justify-center">
      <div className="absolute bottom-4 mx-auto w-[calc(100%-2rem)] max-w-sm h-16 bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg border flex items-center justify-around">
        {navItems
          .filter((item) => item.roles.includes(userRole || 'customer'))
          .map(renderNavItem)}
      </div>
    </div>
  );
}
