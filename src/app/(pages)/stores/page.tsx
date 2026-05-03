
"use client";

import { Suspense } from "react";
import { BackButton } from "@/components/layout/back-button";
import StoresList from "./list";

export default function StoresPage() {
  return (
    <div className="bg-background min-h-full">
        <div className="container mx-auto px-4 py-8 relative">
             <div className="absolute top-4 left-4 z-10">
                <BackButton />
             </div>
             <Suspense fallback={<div className="text-center py-8">جاري تحميل المتجر...</div>}>
               <StoresList />
             </Suspense>
        </div>
    </div>
  );
}

    