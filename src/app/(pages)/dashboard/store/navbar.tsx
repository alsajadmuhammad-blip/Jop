"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Package, ShoppingBag, LayoutGrid, Settings, CreditCard } from "lucide-react";

const navLinks = [
  { tab: "products",      label: "المنتجات",   icon: Package },
  { tab: "orders",        label: "الطلبات",    icon: ShoppingBag },
  { tab: "sections",      label: "الأقسام",    icon: LayoutGrid },
  { tab: "subscription",  label: "الاشتراك",   icon: CreditCard },
  { tab: "settings",      label: "الإعدادات",  icon: Settings },
];

export function StoreOwnerNavbar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <nav className="overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex min-w-max items-center gap-0.5 rounded-xl bg-slate-100 p-1">
        {navLinks.map((link) => {
          const isActive = activeTab === link.tab;
          const Icon = link.icon;
          return (
            <button
              key={link.tab}
              onClick={() => onTabChange(link.tab)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium outline-none transition-colors whitespace-nowrap",
                isActive
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/60"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
              <span className="relative z-10">{link.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
