"use client";

import { cn } from "@/lib/utils";
import {
  Package, ShoppingBag, LayoutGrid, Settings,
  CreditCard, Zap, Tag, Star, ShoppingCart,
  Store, Megaphone, SlidersHorizontal, Boxes,
} from "lucide-react";

/* ─── هيكل التبويبات ─── */
const NAV_GROUPS = [
  {
    id: "store",
    label: "المتجر",
    icon: Store,
    tabs: [
      { tab: "products", label: "المنتجات", icon: Package },
      { tab: "orders",   label: "الطلبات",  icon: ShoppingBag },
      { tab: "pos",      label: "الكاشير",  icon: ShoppingCart },
      { tab: "inventory", label: "المخزون", icon: Boxes },
      { tab: "sections", label: "الأقسام",  icon: LayoutGrid },
    ],
  },
  {
    id: "marketing",
    label: "التسويق",
    icon: Megaphone,
    tabs: [
      { tab: "flash",   label: "عروض فلاش",   icon: Zap },
      { tab: "coupons", label: "كودات الخصم", icon: Tag },
    ],
  },
  {
    id: "manage",
    label: "الإدارة",
    icon: SlidersHorizontal,
    tabs: [
      { tab: "analytics",    label: "التقييمات", icon: Star },
      { tab: "subscription", label: "الاشتراك",  icon: CreditCard },
      { tab: "settings",     label: "الإعدادات", icon: Settings },
    ],
  },
] as const;

type GroupId = (typeof NAV_GROUPS)[number]["id"];

function getGroupForTab(tab: string) {
  return (
    NAV_GROUPS.find((g) => g.tabs.some((t) => t.tab === tab)) ?? NAV_GROUPS[0]
  );
}

/* ─── المكوّن ─── */
export function StoreOwnerNavbar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const activeGroup = getGroupForTab(activeTab);

  return (
    <div className="space-y-0">

      {/* ── الصف الأول: أزرار المجموعات ── */}
      <div className="flex items-center gap-1.5 py-2.5">
        {NAV_GROUPS.map((group) => {
          const isActive = activeGroup.id === group.id;
          const GroupIcon = group.icon;
          return (
            <button
              key={group.id}
              onClick={() => onTabChange(group.tabs[0].tab)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all duration-150 outline-none select-none",
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              )}
            >
              <GroupIcon
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  isActive ? "text-white" : "text-slate-400"
                )}
              />
              {group.label}
            </button>
          );
        })}
      </div>

      {/* ── الصف الثاني: التبويبات الفرعية للمجموعة النشطة ── */}
      <nav
        className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex min-w-max items-stretch border-t border-slate-100">
          {activeGroup.tabs.map((link) => {
            const isActive = activeTab === link.tab;
            const Icon = link.icon;
            return (
              <button
                key={link.tab}
                onClick={() => onTabChange(link.tab)}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold whitespace-nowrap outline-none select-none transition-colors duration-150",
                  isActive
                    ? "text-primary"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 transition-colors duration-150",
                    isActive ? "text-primary" : "text-slate-400"
                  )}
                />
                <span>{link.label}</span>

                {/* مؤشر التبويب النشط */}
                {isActive && (
                  <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
