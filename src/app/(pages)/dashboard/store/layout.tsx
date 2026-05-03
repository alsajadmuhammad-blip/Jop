"use client";

import { StoreOwnerNavbar } from "./navbar";
import { ReactNode } from "react";

export default function StoreOwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/10">
      <StoreOwnerNavbar />
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  );
}
