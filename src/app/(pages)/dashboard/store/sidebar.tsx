"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Package, ShoppingBag, LayoutGrid, Settings,
  CreditCard, Zap, Tag, Star, ShoppingCart, Boxes,
  Eye, LogOut, Package2, Megaphone,
  ChevronLeft, MoreHorizontal,
} from "lucide-react";

/* ─── هيكل التنقل ─────────────────────────────────── */

export const NAV_GROUPS = [
  {
    id: "store",
    label: "المتجر",
    items: [
      { tab: "products",  label: "المنتجات",  icon: Package },
      { tab: "orders",    label: "الطلبات",   icon: ShoppingBag },
      { tab: "pos",       label: "الكاشير",   icon: ShoppingCart },
      { tab: "inventory", label: "المخزون",   icon: Boxes },
      { tab: "sections",  label: "الأقسام",   icon: LayoutGrid },
    ],
  },
  {
    id: "marketing",
    label: "التسويق",
    items: [
      { tab: "flash",     label: "عروض فلاش",   icon: Zap },
      { tab: "coupons",   label: "كودات الخصم",  icon: Tag },
      { tab: "analytics", label: "التقييمات",    icon: Star },
    ],
  },
  {
    id: "manage",
    label: "الإدارة",
    items: [
      { tab: "subscription", label: "الاشتراك",  icon: CreditCard },
      { tab: "settings",     label: "الإعدادات", icon: Settings },
    ],
  },
] as const;

/* ─── عنصر تنقل واحد ─────────────────────────────── */

function NavItem({
  tab, label, icon: Icon, isActive, onClick,
}: {
  tab: string; label: string; icon: React.ElementType;
  isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 outline-none select-none",
        isActive
          ? "bg-primary text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon
        className={cn("h-[17px] w-[17px] shrink-0 transition-colors", isActive ? "text-white/90" : "text-slate-400 group-hover:text-slate-600")}
        strokeWidth={isActive ? 2.3 : 1.9}
      />
      <span className="flex-1 text-right">{label}</span>
    </button>
  );
}

/* ─── الـ Sidebar الكامل ─────────────────────────── */

interface StoreSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  storeName: string;
  storeLogoUrl?: string | null;
  storeId: string;
  isActive: boolean;
  onLogout: () => void;
}

export function StoreSidebar({
  activeTab, onTabChange, storeName, storeLogoUrl,
  storeId, isActive, onLogout,
}: StoreSidebarProps) {
  return (
    <div className="flex flex-col h-full">

      {/* ── هوية المتجر ───────────────────── */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="relative shrink-0">
            {storeLogoUrl ? (
              <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <Image src={storeLogoUrl} alt={storeName} fill sizes="40px" className="object-cover" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <span className={cn(
              "absolute -bottom-0.5 -left-0.5 h-[11px] w-[11px] rounded-full border-2 border-slate-50",
              isActive ? "bg-emerald-500" : "bg-slate-300"
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate leading-snug">{storeName}</p>
            <p className={cn("text-[11px] font-medium leading-snug mt-0.5",
              isActive ? "text-emerald-600" : "text-slate-400"
            )}>
              {isActive ? "متجر نشط" : "غير نشط"}
            </p>
          </div>
        </div>
      </div>

      {/* ── التنقل ────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto px-3 space-y-5 pb-3"
        style={{ scrollbarWidth: "none" }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="px-3 mb-1 text-[10.5px] font-bold uppercase tracking-widest text-slate-400 select-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ tab, label, icon }) => (
                <NavItem
                  key={tab}
                  tab={tab}
                  label={label}
                  icon={icon}
                  isActive={activeTab === tab}
                  onClick={() => onTabChange(tab)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── الجزء السفلي ─────────────────── */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
        <Link
          href={`/store?id=${storeId}`}
          target="_blank"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors"
        >
          <Eye className="h-[17px] w-[17px] text-slate-400 shrink-0" />
          <span className="flex-1 text-right">معاينة المتجر</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" />
          <span className="flex-1 text-right">تسجيل الخروج</span>
        </button>
      </div>

    </div>
  );
}

/* ──────────────────────────────────────────────────
   MOBILE: Bottom bar + More Drawer
   ─────────────────────────────────────────────── */

const BOTTOM_PRIMARY = [
  { tab: "products",  label: "المنتجات", icon: Package },
  { tab: "orders",    label: "الطلبات",  icon: ShoppingBag },
  { tab: "pos",       label: "الكاشير",  icon: ShoppingCart },
  { tab: "inventory", label: "المخزون",  icon: Boxes },
];

const MORE_ITEMS = [
  { tab: "sections",     label: "الأقسام",      icon: LayoutGrid, group: "store" },
  { tab: "flash",        label: "عروض فلاش",    icon: Zap,        group: "marketing" },
  { tab: "coupons",      label: "كودات الخصم",  icon: Tag,        group: "marketing" },
  { tab: "analytics",    label: "التقييمات",    icon: Star,       group: "marketing" },
  { tab: "subscription", label: "الاشتراك",     icon: CreditCard, group: "manage" },
  { tab: "settings",     label: "الإعدادات",    icon: Settings,   group: "manage" },
];

export function StoreMobileBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((i) => i.tab === activeTab);

  return (
    <>
      {/* ── Overlay ───────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer "المزيد" ───────────── */}
      <div
        className={cn(
          "fixed inset-x-0 z-50 md:hidden transition-all duration-300 ease-out",
          open
            ? "bottom-[72px] opacity-100 translate-y-0 pointer-events-auto"
            : "bottom-[72px] opacity-0 translate-y-3 pointer-events-none"
        )}
      >
        <div className="mx-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-4 pt-3 pb-1.5 border-b border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">المزيد</p>
            </div>
            <div className="p-2 grid grid-cols-3 gap-1">
              {MORE_ITEMS.map(({ tab, label, icon: Icon }) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => { onTabChange(tab); setOpen(false); }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors",
                      active ? "bg-primary/10" : "hover:bg-slate-50"
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5", active ? "text-primary" : "text-slate-500")}
                      strokeWidth={active ? 2.4 : 1.9}
                    />
                    <span className={cn("text-[11px] font-semibold text-center leading-tight",
                      active ? "text-primary" : "text-slate-600"
                    )}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden">
        <div className="mx-0 border-t border-slate-200 bg-white/97 backdrop-blur-xl">
          <div className="flex items-stretch pb-safe">
            {BOTTOM_PRIMARY.map(({ tab, label, icon: Icon }) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { onTabChange(tab); setOpen(false); }}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-3 transition-colors relative",
                    active ? "text-primary" : "text-slate-400"
                  )}
                >
                  {active && (
                    <span className="absolute top-0 inset-x-4 h-[2px] bg-primary rounded-full" />
                  )}
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  <span className="text-[10px] font-semibold">{label}</span>
                </button>
              );
            })}

            {/* زر المزيد */}
            <button
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-3 transition-colors relative",
                (open || moreActive) ? "text-primary" : "text-slate-400"
              )}
            >
              {(open || moreActive) && (
                <span className="absolute top-0 inset-x-4 h-[2px] bg-primary rounded-full" />
              )}
              <MoreHorizontal className="h-5 w-5" strokeWidth={(open || moreActive) ? 2.4 : 1.8} />
              <span className="text-[10px] font-semibold">المزيد</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
