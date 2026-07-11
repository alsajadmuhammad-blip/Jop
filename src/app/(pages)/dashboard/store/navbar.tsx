"use client";

import { cn } from "@/lib/utils";
import {
  Package, ShoppingBag, LayoutGrid, Settings,
  CreditCard, Zap, Tag, Star, ShoppingCart, Boxes,
} from "lucide-react";

/* ─── التبويبات مُجمَّعة للمنطق فقط (لحساب المجموعة النشطة) ─── */
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

/* ─── المكوّن: يعرض فقط التبويبات الفرعية للمجموعة النشطة ─── */
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
      className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="flex min-w-max items-stretch gap-0.5">
        {activeGroup.tabs.map(({ tab, label, icon: Icon }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-t-lg px-3.5 py-2.5 text-[12.5px] font-semibold whitespace-nowrap outline-none select-none",
                "transition-colors duration-100",
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  isActive ? "text-primary" : "text-slate-400"
                )}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span>{label}</span>

              {isActive && (
                <span className="absolute bottom-0 inset-x-2 h-[2px] rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
