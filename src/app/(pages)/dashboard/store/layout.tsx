"use client";
import { ReactNode } from "react";

// الداشبورد يتحكم بـ layout خاصته (sidebar + content)
// لا نضيف padding هنا لأن AppProviders يعالج paddingTop: 56px
export default function StoreOwnerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
