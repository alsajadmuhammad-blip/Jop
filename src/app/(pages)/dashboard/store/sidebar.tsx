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
    <div className="flex h-full flex-col overflow-hidden bg-card text-card-foreground">

      {/* هوية المتجر */}
      <div className="border-b border-border/70 px-4 pb-3 pt-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-background/70 p-2.5 shadow-sm">
          <div className="relative shrink-0">
            {storeLogoUrl ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-border/70 shadow-sm">
                <Image src={storeLogoUrl} alt={storeName} fill sizes="40px" className="object-cover" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Package2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <span className={cn(
              "absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
              isActive ? "bg-emerald-500" : "bg-slate-400"
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{storeName}</p>
            <p className={cn("text-[11px] font-medium", isActive ? "text-emerald-600" : "text-muted-foreground")}>
            </p>
          </div>
        </div>
      </div>

      {/* التنقل */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: "none" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ tab, label, icon: Icon }) => {
                const active = activeTab === tab;
                return (
                  <button key={tab} onClick={() => onTabChange(tab)}
                    className={cn(
                      "group relative flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(37,99,235,0.22)] ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all",
                      active ? "border-white/20 bg-white/20" : "border-border/70 bg-muted group-hover:border-primary/20"
                    )}>
                      <Icon className={cn("h-3.75 w-3.75", active ? "text-primary-foreground" : "text-muted-foreground")} strokeWidth={active ? 2.3 : 1.9} />
                    </div>
                    <span>{label}</span>
                    {active && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-white/80 shadow-sm" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* أسفل */}
      <div className="space-y-1.5 border-t border-border/70 px-3 py-3">
        <Link href={`/store?id=${storeId}`} target="_blank"
          className="flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-emerald-500/10 hover:text-emerald-600"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
            <Eye className="h-3.75 w-3.75 text-emerald-600" />
          </div>
          <span>معاينة المتجر</span>
        </Link>
        <button onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10">
            <LogOut className="h-3.75 w-3.75 text-destructive" />
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
        style={{ position: "absolute", inset: 0, background: "rgba(2,8,23,0.72)" }}
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
          background: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(2,8,23,0.22)",
          overflowY: "auto",
          borderLeft: "1px solid hsl(var(--border))",
        }}
      >
        {/* رأس الـ drawer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid hsl(var(--border))", flexShrink: 0,
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
            <span style={{ fontWeight: 700, fontSize: 14, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))", padding: "0 8px",
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
                        background: active ? "hsl(var(--primary))" : "transparent",
                        color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                        fontWeight: 600, fontSize: 14, textAlign: "right",
                        transition: "background 0.15s",
                        boxShadow: active ? "0 10px 24px rgba(37, 99, 235, 0.22)" : "none",
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? "rgba(255,255,255,0.2)" : "hsl(var(--muted))",
                      }}>
                        <Icon style={{ width: 16, height: 16, color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))" }} strokeWidth={active ? 2.3 : 1.9} />
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
        <div style={{ padding: "8px 12px 20px", borderTop: "1px solid hsl(var(--border))", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <Link
            href={`/store?id=${storeId}`} target="_blank"
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 10px", borderRadius: 10,
              color: "hsl(142 76% 36%)", fontWeight: 600, fontSize: 14,
              textDecoration: "none", background: "rgba(16, 185, 129, 0.12)",
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16, 185, 129, 0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Eye style={{ width: 16, height: 16, color: "hsl(142 76% 36%)" }} />
            </div>
            <span>معاينة المتجر</span>
          </Link>
          <button
            onClick={() => { onLogout(); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 10px", borderRadius: 10, border: "none", cursor: "pointer",
              color: "hsl(var(--destructive))", fontWeight: 600, fontSize: 14,
              background: "transparent", width: "100%", textAlign: "right",
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239, 68, 68, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LogOut style={{ width: 16, height: 16, color: "hsl(var(--destructive))" }} />
            </div>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}
