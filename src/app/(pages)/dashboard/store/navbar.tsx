"use client";

import { cn } from "@/lib/utils";
import { Package, ShoppingBag, LayoutGrid, Settings, CreditCard } from "lucide-react";

const navLinks = [
  { tab: "products",     label: "المنتجات",  icon: Package },
  { tab: "orders",       label: "الطلبات",   icon: ShoppingBag },
  { tab: "sections",     label: "الأقسام",   icon: LayoutGrid },
  { tab: "subscription", label: "الاشتراك",  icon: CreditCard },
  { tab: "settings",     label: "الإعدادات", icon: Settings },
];

export function StoreOwnerNavbar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <nav
      className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="inline-flex min-w-max w-full items-stretch gap-0 border-b border-slate-200">
        {navLinks.map((link) => {
          const isActive = activeTab === link.tab;
          const Icon = link.icon;
          return (
            <button
              key={link.tab}
              onClick={() => onTabChange(link.tab)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 px-4 py-2.5 text-[11px] font-semibold whitespace-nowrap outline-none transition-colors duration-150",
                isActive
                  ? "text-primary"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors duration-150",
                  isActive ? "text-primary" : "text-slate-400"
                )}
              />
              <span>{link.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
