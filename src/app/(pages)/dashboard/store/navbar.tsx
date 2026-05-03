"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/dashboard/store", label: "الرئيسية" },
  { href: "/dashboard/store/orders", label: "الطلبات" },
  { href: "/dashboard/store/products", label: "المنتجات" },
  { href: "/dashboard/store/history", label: "سجل الطلبات" },
  { href: "/dashboard/store/settings", label: "الإعدادات" }
];

export function StoreOwnerNavbar() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 border-b mb-6 bg-background px-2 py-2 rounded-lg shadow-sm">
      {navLinks.map(link => (
        <Button
          key={link.href}
          asChild
          variant={pathname === link.href ? "default" : "ghost"}
          className="rounded-full"
        >
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ))}
    </nav>
  );
}
