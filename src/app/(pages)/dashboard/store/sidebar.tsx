"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Package, ShoppingBag, LayoutGrid, Settings,
  CreditCard, Zap, Tag, Star, ShoppingCart, Boxes,
  Eye, LogOut, Package2, X,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   Navigation structure
═══════════════════════════════════════════════════ */
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
      { tab: "flash",     label: "عروض فلاش",  icon: Zap },
      { tab: "coupons",   label: "كودات الخصم", icon: Tag },
      { tab: "analytics", label: "التقييمات",   icon: Star },
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

/* ═══════════════════════════════════════════════════
   Shared nav item
═══════════════════════════════════════════════════ */
function NavItem({
  tab, label, icon: Icon, isActive, onClick, size = "md",
}: {
  tab: string; label: string; icon: React.ElementType;
  isActive: boolean; onClick: () => void;
  size?: "md" | "lg";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 rounded-xl font-medium transition-all duration-150 outline-none select-none text-right",
        size === "lg" ? "px-4 py-3.5 text-[15px]" : "px-3 py-2.5 text-sm",
        isActive
          ? "bg-primary text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-lg shrink-0",
        size === "lg" ? "h-9 w-9" : "h-8 w-8",
        isActive ? "bg-white/15" : "bg-slate-100 group-hover:bg-slate-200"
      )}>
        <Icon
          className={cn(
            size === "lg" ? "h-[18px] w-[18px]" : "h-4 w-4",
            isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
          )}
          strokeWidth={isActive ? 2.3 : 1.9}
        />
      </div>
      <span className="flex-1">{label}</span>
      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white/70 shrink-0" />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   Store identity card (shared between sidebar & drawer)
═══════════════════════════════════════════════════ */
function StoreCard({
  storeName, storeLogoUrl, isActive,
}: {
  storeName: string; storeLogoUrl?: string | null; isActive: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/5 border border-primary/10">
      <div className="relative shrink-0">
        {storeLogoUrl ? (
          <div className="relative h-12 w-12 rounded-xl overflow-hidden border-2 border-white shadow">
            <Image src={storeLogoUrl} alt={storeName} fill sizes="48px" className="object-cover" />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-xl bg-primary/10 border-2 border-white shadow flex items-center justify-center">
            <Package2 className="h-6 w-6 text-primary" />
          </div>
        )}
        <span className={cn(
          "absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-white",
          isActive ? "bg-emerald-500" : "bg-slate-300"
        )} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800 truncate leading-snug">{storeName}</p>
        <p className={cn(
          "text-xs font-medium mt-0.5",
          isActive ? "text-emerald-600" : "text-slate-400"
        )}>
          {isActive ? "● متجر نشط" : "○ غير نشط"}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Desktop Sidebar (fixed, right side)
═══════════════════════════════════════════════════ */
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
    <div className="flex flex-col h-full bg-white">

      {/* Store identity */}
      <div className="px-4 pt-5 pb-4">
        <StoreCard storeName={storeName} storeLogoUrl={storeLogoUrl} isActive={isActive} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4" style={{ scrollbarWidth: "none" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ tab, label, icon }) => (
                <NavItem
                  key={tab} tab={tab} label={label} icon={icon}
                  isActive={activeTab === tab}
                  onClick={() => onTabChange(tab)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
        <Link
          href={`/store?id=${storeId}`}
          target="_blank"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
        >
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100">
            <Eye className="h-4 w-4 text-slate-500" />
          </div>
          <span className="flex-1">معاينة المتجر</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100">
            <LogOut className="h-4 w-4 text-slate-400" />
          </div>
          <span className="flex-1">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Mobile Drawer (slides in from right)
═══════════════════════════════════════════════════ */
interface StoreMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  storeName: string;
  storeLogoUrl?: string | null;
  storeId: string;
  isActive: boolean;
  onLogout: () => void;
}

export function StoreMobileDrawer({
  isOpen, onClose,
  activeTab, onTabChange,
  storeName, storeLogoUrl, storeId, isActive, onLogout,
}: StoreMobileDrawerProps) {
  const handleSelect = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[82vw] max-w-[320px] bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">القائمة</p>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Store card */}
        <div className="px-4 pt-4 pb-3">
          <StoreCard storeName={storeName} storeLogoUrl={storeLogoUrl} isActive={isActive} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4" style={{ scrollbarWidth: "none" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 select-none">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ tab, label, icon }) => (
                  <NavItem
                    key={tab} tab={tab} label={label} icon={icon}
                    isActive={activeTab === tab}
                    onClick={() => handleSelect(tab)}
                    size="lg"
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <Link
            href={`/store?id=${storeId}`}
            target="_blank"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100">
              <Eye className="h-[18px] w-[18px] text-slate-500" />
            </div>
            <span className="flex-1">معاينة المتجر</span>
          </Link>
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100">
              <LogOut className="h-[18px] w-[18px] text-slate-400" />
            </div>
            <span className="flex-1">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
}
