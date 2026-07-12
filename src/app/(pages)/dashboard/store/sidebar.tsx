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

/* ── عنصر تنقل مشترك ── */
function NavItem({
  label, icon: Icon, isActive, onClick, compact = false,
}: {
  label: string; icon: React.ElementType;
  isActive: boolean; onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-2.5 rounded-xl text-sm font-medium transition-all duration-150 outline-none select-none text-right",
        compact ? "px-3 py-2" : "px-3 py-2.5",
        isActive
          ? "bg-primary text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <div className={cn(
        "h-7 w-7 flex items-center justify-center rounded-lg shrink-0",
        isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
      )}>
        <Icon
          className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700")}
          strokeWidth={isActive ? 2.3 : 1.9}
        />
      </div>
      <span className="flex-1">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   Desktop Sidebar
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

      {/* هوية المتجر */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
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
              "absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
              isActive ? "bg-emerald-500" : "bg-slate-300"
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate">{storeName}</p>
            <p className={cn("text-[11px] font-medium", isActive ? "text-emerald-600" : "text-slate-400")}>
              {isActive ? "نشط" : "غير نشط"}
            </p>
          </div>
        </div>
      </div>

      {/* التنقل */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5" style={{ scrollbarWidth: "none" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ tab, label, icon }) => (
                <NavItem key={tab} label={label} icon={icon}
                  isActive={activeTab === tab} onClick={() => onTabChange(tab)} compact />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* أسفل */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
        <Link
          href={`/store?id=${storeId}`} target="_blank"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
        >
          <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100">
            <Eye className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <span>معاينة المتجر</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100">
            <LogOut className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Mobile Drawer — يتزلق من اليمين
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

  const pick = (tab: string) => { onTabChange(tab); onClose(); };

  // كل الصفحات في قائمة واحدة مسطّحة (بدون groups لتقليص الطول)
  const allItems: { tab: string; label: string; icon: React.ElementType }[] =
    (NAV_GROUPS as readonly { items: readonly { tab: string; label: string; icon: React.ElementType }[] }[])
      .flatMap(g => [...g.items]);

  return (
    <>
      {/* Backdrop — z-[55] أدنى من البانل */}
      {isOpen && (
        <div
          aria-hidden
          onClick={onClose}
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
        />
      )}

      {/* Panel — z-[60] فوق الـ backdrop */}
      <div
        onClick={e => e.stopPropagation()}   /* يمنع التسرب للـ backdrop */
        className={cn(
          "fixed top-0 right-0 z-[60] h-full bg-white shadow-2xl md:hidden",
          "w-64 flex flex-col",
          "transition-transform duration-250 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
      >
        {/* رأس الـ drawer */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {storeLogoUrl ? (
              <div className="relative h-7 w-7 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <Image src={storeLogoUrl} alt={storeName} fill sizes="28px" className="object-cover" />
              </div>
            ) : (
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package2 className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <span className="text-sm font-bold text-slate-800 truncate">{storeName}</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* قائمة التنقل */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" style={{ scrollbarWidth: "none" }}>
          {allItems.map(({ tab, label, icon: Icon }) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => pick(tab)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <div className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg shrink-0",
                  active ? "bg-white/20" : "bg-slate-100"
                )}>
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-500")} strokeWidth={active ? 2.3 : 1.9} />
                </div>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* أسفل */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-0.5 shrink-0">
          <Link
            href={`/store?id=${storeId}`} target="_blank"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 shrink-0">
              <Eye className="h-4 w-4 text-slate-500" />
            </div>
            <span>معاينة المتجر</span>
          </Link>
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 shrink-0">
              <LogOut className="h-4 w-4 text-slate-400" />
            </div>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
}
