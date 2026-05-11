"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const navLinks = [
  { tab: "products", label: "المنتجات" },
  { tab: "orders", label: "الطلبات" },
  { tab: "settings", label: "الإعدادات" },
];

export function StoreOwnerNavbar() {
  const pathname = usePathname();
  const isStoreRoute = pathname?.startsWith("/dashboard/store");

  return (
    <nav className="flex flex-wrap gap-2 border-b mb-6 bg-background px-3 py-3 rounded-2xl shadow-sm">
      {navLinks.map((link) => (
        <Button
          key={link.tab}
          asChild
          variant="ghost"
          className="rounded-full"
        >
          <Link href={`/dashboard/store?tab=${link.tab}`}>{link.label}</Link>
        </Button>
      ))}
    </nav>
  );
}
