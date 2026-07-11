"use client";

import { cn } from "@/lib/utils";
import {
  Package, ShoppingBag, LayoutGrid, Settings,
  CreditCard, Zap, Tag, Star, ShoppingCart, Boxes,
} from "lucide-react";

/* ─── التبويبات مُجمَّعة ─── */
const NAV_GROUPS = [
  {
    id: "store",
    tabs: [
      { tab: "products",  label: "المنتجات", icon: Package },
      { tab: "orders",    label: "الطلبات",  icon: ShoppingBag },
      { tab: "pos",       label: "الكاشير",  icon: ShoppingCart },
      { tab: "inventory", label: "المخزون",  icon: Boxes },
      { tab: "sections",  label: "الأقسام",  icon: LayoutGrid },
    ],
  },
  {
    id: "marketing",
    tabs: [
      { tab: "flash",   label: "عروض فلاش",   icon: Zap },
      { tab: "coupons", label: "كودات الخصم", icon: Tag },
    ],
  },
  {
    id: "manage",
    tabs: [
      { tab: "analytics",    label: "التقييمات", icon: Star },
      { tab: "subscription", label: "الاشتراك",  icon: CreditCard },
      { tab: "settings",     label: "الإعدادات", icon: Settings },
    ],
  },
] as const;

function getGroupForTab(tab: string) {
  return NAV_GROUPS.find((g) => g.tabs.some((t) => t.tab === tab)) ?? NAV_GROUPS[0];
}

/* ─── المكوّن: شبكة بطاقات بدل التبويبات ─── */
export function StoreOwnerNavbar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const activeGroup = getGroupForTab(activeTab);

  return (
    <nav
      className="-mx-4 sm:-mx-6 overflow-x-auto px-3 sm:px-5 pb-3 pt-2"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="flex min-w-max gap-2">
        {activeGroup.tabs.map(({ tab, label, icon: Icon }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5",
                "w-[72px] py-2.5 rounded-2xl border text-center",
                "transition-all duration-150 select-none outline-none",
                isActive
                  ? "border-primary/30 bg-primary/8 shadow-sm shadow-primary/10"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center",
                  isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              <span
                className={cn(
                  "text-[10.5px] font-semibold leading-tight",
                  isActive ? "text-primary" : "text-slate-500"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
