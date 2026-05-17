"use client";

import { ReactNode } from "react";

export default function StoreOwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/10">
      <main className="w-full py-6">
        {children}
      </main>
    </div>
  );
}
