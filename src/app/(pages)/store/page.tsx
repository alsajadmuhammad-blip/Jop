import { Suspense } from "react";
import StorePageClient from "./store-page-client";

export default function StorePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-slate-50" />}> 
      <StorePageClient />
    </Suspense>
  );
}
