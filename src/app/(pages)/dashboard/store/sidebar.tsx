"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Package, ShoppingBag, LayoutGrid, Settings,
  CreditCard, Zap, Tag, Star, ShoppingCart, Boxes,
  Eye, LogOut, Package2, ChevronLeft,
  Megaphone, Store,
} from "lucide-react";

// ─── بيانات التنقل ────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    id: "store",
    label: "المتجر",
    icon: Store,
    items: [
      { tab: "products",  label: "المنتجات", icon: Package },
      { tab: "orders",    label: "الطلبات",  icon: ShoppingBag },
      { tab: "pos",       label: "الكاشير",  icon: ShoppingCart },
      { tab: "inventory", label: "المخزون",  icon: Boxes },
      { tab: "sections",  label: "الأقسام",  icon: LayoutGrid },
    ],
  },
  {
    id: "marketing",
    label: "التسويق",
    icon: Megaphone,
    items: [
      { tab: "flash",     label: "عروض فلاش",   icon: Zap },
      { tab: "coupons",   label: "كودات الخصم", icon: Tag },
      { tab: "analytics", label: "التقييمات",   icon: Star },
    ],
  },
  {
    id: "manage",
    label: "الإدارة",
    icon: Settings,
    items: [
      { tab: "subscription", label: "الاشتراك",  icon: CreditCard },
      { tab: "settings",     label: "الإعدادات", icon: Settings },
    ],
  },
] as const;

// ─── Props ────────────────────────────────────────────────────────

interface StoreSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  storeName: string;
  storeLogoUrl?: string | null;
  storeId: string;
  isActive: boolean;
  onLogout: () => void;
}

// ─── عنصر التنقل ─────────────────────────────────────────────────

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
        "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-right",
        isActive
          ? "bg-primary text-white shadow-sm shadow-primary/25"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon
        className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")}
        strokeWidth={isActive ? 2.4 : 2}
      />
      <span className="flex-1 truncate">{label}</span>
      {isActive && <ChevronLeft className="h-3.5 w-3.5 text-white/70 shrink-0" />}
    </button>
  );
}

// ─── الشريط الجانبي ───────────────────────────────────────────────

export function StoreSidebar({
  activeTab, onTabChange, storeName, storeLogoUrl,
  storeId, isActive, onLogout,
}: StoreSidebarProps) {
  return (
    <aside className="flex flex-col h-full select-none">

      {/* ── هوية المتجر ── */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {storeLogoUrl ? (
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <Image src={storeLogoUrl} alt={storeName} fill className="object-cover" sizes="44px" />
              </div>
            ) : (
              <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Package2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <span className={cn(
              "absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-white",
              isActive ? "bg-emerald-500" : "bg-slate-300"
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate leading-tight">{storeName}</p>
            <p className={cn("text-[11px] font-medium mt-0.5", isActive ? "text-emerald-600" : "text-slate-400")}>
              {isActive ? "● نشط" : "○ غير نشط"}
            </p>
          </div>
        </div>
      </div>

      {/* ── التنقل ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5"
        style={{ scrollbarWidth: "none" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            {/* عنوان القسم */}
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ tab, label, icon }) => (
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

      {/* ── أسفل السايدبار ── */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-1">
        <Link
          href={`/store?id=${storeId}`}
          target="_blank"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors"
        >
          <Eye className="h-4 w-4 text-slate-400 shrink-0" />
          <span>معاينة المتجر</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

    </aside>
  );
}

// ─── Bottom bar للموبايل (5 عناصر ثابتة + drawer للباقي) ─────────

const BOTTOM_PRIMARY = [
  { tab: "products",  label: "المنتجات", icon: Package },
  { tab: "orders",    label: "الطلبات",  icon: ShoppingBag },
  { tab: "pos",       label: "الكاشير",  icon: ShoppingCart },
  { tab: "inventory", label: "المخزون",  icon: Boxes },
];

const DRAWER_ITEMS = [
  { tab: "sections",     label: "الأقسام",      icon: LayoutGrid },
  { tab: "flash",        label: "عروض فلاش",    icon: Zap },
  { tab: "coupons",      label: "كودات الخصم",  icon: Tag },
  { tab: "analytics",    label: "التقييمات",    icon: Star },
  { tab: "subscription", label: "الاشتراك",     icon: CreditCard },
  { tab: "settings",     label: "الإعدادات",    icon: Settings },
];

export function StoreMobileBar({
  activeTab, onTabChange,
}: { activeTab: string; onTabChange: (tab: string) => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const moreActive = DRAWER_ITEMS.some((i) => i.tab === activeTab);

  return (
    <>
      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden">
        <div className="mx-3 mb-3">
          <div className="flex items-stretch bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl shadow-black/8 overflow-hidden">
            {BOTTOM_PRIMARY.map(({ tab, label, icon: Icon }) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { onTabChange(tab); setDrawerOpen(false); }}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors relative",
                    active ? "text-primary" : "text-slate-400 active:text-slate-600"
                  )}
                >
                  {active && (
                    <span className="absolute top-0 inset-x-3 h-0.5 bg-primary rounded-full" />
                  )}
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  <span className="text-[10px] font-semibold">{label}</span>
                </button>
              );
            })}

            {/* زر المزيد */}
            <button
              onClick={() => setDrawerOpen((v) => !v)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors relative",
                (drawerOpen || moreActive) ? "text-primary" : "text-slate-400"
              )}
            >
              {(drawerOpen || moreActive) && (
                <span className="absolute top-0 inset-x-3 h-0.5 bg-primary rounded-full" />
              )}
              <div className="h-5 w-5 flex items-center justify-center">
                <span className="flex gap-[3px] items-center">
                  {[0,1,2].map((i) => (
                    <span key={i} className={cn(
                      "block rounded-full transition-all",
                      (drawerOpen || moreActive) ? "bg-primary" : "bg-slate-400",
                      i === 1 ? "h-[5px] w-[5px]" : "h-[4px] w-[4px]"
                    )} />
                  ))}
                </span>
              </div>
              <span className="text-[10px] font-semibold">المزيد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/20 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed inset-x-0 bottom-[76px] z-50 md:hidden transition-all duration-300 ease-out",
        drawerOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-4 opacity-0 pointer-events-none"
      )}>
        <div className="mx-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">خيارات إضافية</p>
            </div>
            <div className="p-2 grid grid-cols-3 gap-1.5">
              {DRAWER_ITEMS.map(({ tab, label, icon: Icon }) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => { onTabChange(tab); setDrawerOpen(false); }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors",
                      active ? "bg-primary/10 text-primary" : "hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-slate-400")} strokeWidth={active ? 2.4 : 2} />
                    <span className="text-[11px] font-semibold leading-tight text-center">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
