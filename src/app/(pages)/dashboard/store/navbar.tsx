"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navLinks = [
  { tab: "products", label: "المنتجات" },
  { tab: "orders", label: "الطلبات" },
  { tab: "sections", label: "الأقسام" },
  { tab: "settings", label: "الإعدادات" },
];

export function StoreOwnerNavbar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <nav className="relative -mx-4 px-4 overflow-x-auto hide-scrollbar sm:mx-0 sm:px-0">
      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200/60">
        {navLinks.map((link) => {
          const isActive = activeTab === link.tab;
          return (
            <button
              key={link.tab}
              onClick={() => onTabChange(link.tab)}
              className={cn(
                "relative rounded-xl px-5 py-2.5 text-sm font-medium outline-none transition-colors",
                isActive ? "text-primary" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
