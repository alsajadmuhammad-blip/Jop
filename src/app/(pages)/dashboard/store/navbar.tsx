"use client";

import { Button } from "@/components/ui/button";

const navLinks = [
  { tab: "products", label: "المنتجات" },
  { tab: "orders", label: "الطلبات" },
  { tab: "sections", label: "الأقسام" },
  { tab: "settings", label: "الإعدادات" },
];

export function StoreOwnerNavbar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <nav className="overflow-x-auto pb-2">
      <div className="inline-flex min-w-max items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 shadow-sm">
        {navLinks.map((link) => (
          <Button
            key={link.tab}
            variant={activeTab === link.tab ? "default" : "outline"}
            className="min-w-[95px] whitespace-nowrap rounded-full px-3 py-2 text-sm"
            onClick={() => onTabChange(link.tab)}
          >
            {link.label}
          </Button>
        ))}
      </div>
    </nav>
  );
}
