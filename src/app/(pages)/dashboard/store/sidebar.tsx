"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Package, ShoppingBag, LayoutGrid, Settings,
  CreditCard, Zap, Tag, Star, ShoppingCart, Boxes,
  Eye, LogOut, Package2, X,
} from "lucide-react";

/* ═══════════════════════════════════════
   هيكل التنقل
════════════════════════════════════════ */
export const NAV_GROUPS = [
  {
    id: "store",
    label: "المتجر",
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

/* ═══════════════════════════════════════
   Desktop Sidebar (fixed, right side)
════════════════════════════════════════ */
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
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: "none" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ tab, label, icon: Icon }) => {
                const active = activeTab === tab;
                return (
                  <button key={tab} onClick={() => onTabChange(tab)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all",
                      active ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <div className={cn("h-7 w-7 flex items-center justify-center rounded-lg shrink-0",
                      active ? "bg-white/20" : "bg-slate-100"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", active ? "text-white" : "text-slate-500")} strokeWidth={active ? 2.3 : 1.9} />
                    </div>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* أسفل */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
        <Link href={`/store?id=${storeId}`} target="_blank"
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
        >
          <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100">
            <Eye className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <span>معاينة المتجر</span>
        </Link>
        <button onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
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

/* ═══════════════════════════════════════
   Mobile Drawer
   - لا transform، لا translate
   - conditional render فقط
   - z-index عالٍ جداً
════════════════════════════════════════ */
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
  if (!isOpen) return null;

  const pick = (tab: string) => { onTabChange(tab); onClose(); };

  return (
    <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 999 }}>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }}
      />

      {/* Panel — يأتي من اليمين */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 260,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
          overflowY: "auto",
        }}
      >
        {/* رأس الـ drawer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #f1f5f9", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {storeLogoUrl ? (
              <div style={{ position: "relative", width: 32, height: 32, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0 }}>
                <Image src={storeLogoUrl} alt={storeName} fill sizes="32px" style={{ objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary, #6366f1)1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package2 style={{ width: 16, height: 16 }} />
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {storeName}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <X style={{ width: 16, height: 16, color: "#475569" }} />
          </button>
        </div>

        {/* التنقل بتقسيم ذكي */}
        <nav style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.id} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 16 : 0 }}>
              {/* تسمية المجموعة */}
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#94a3b8", padding: "0 8px",
                marginBottom: 4,
              }}>
                {group.label}
              </div>
              {/* عناصر المجموعة */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map(({ tab, label, icon: Icon }) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => pick(tab)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 10px", borderRadius: 10, border: "none", cursor: "pointer",
                        background: active ? "var(--primary, #6366f1)" : "transparent",
                        color: active ? "#fff" : "#475569",
                        fontWeight: 600, fontSize: 14, textAlign: "right",
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                      }}>
                        <Icon style={{ width: 16, height: 16, color: active ? "#fff" : "#64748b" }} strokeWidth={active ? 2.3 : 1.9} />
                      </div>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* أسفل الـ drawer */}
        <div style={{ padding: "8px 12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <Link
            href={`/store?id=${storeId}`} target="_blank"
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 10px", borderRadius: 10,
              color: "#059669", fontWeight: 600, fontSize: 14,
              textDecoration: "none", background: "#f0fdf4",
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Eye style={{ width: 16, height: 16, color: "#059669" }} />
            </div>
            <span>معاينة المتجر</span>
          </Link>
          <button
            onClick={() => { onLogout(); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 10px", borderRadius: 10, border: "none", cursor: "pointer",
              color: "#dc2626", fontWeight: 600, fontSize: 14,
              background: "transparent", width: "100%", textAlign: "right",
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LogOut style={{ width: 16, height: 16, color: "#dc2626" }} />
            </div>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}
