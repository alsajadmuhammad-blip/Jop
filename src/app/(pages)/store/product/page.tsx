import { Suspense } from "react";
import ProductPageClient from "./product-page-client";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Skeleton className="w-full aspect-square max-h-[400px] rounded-none" />
      <div className="px-4 pt-5 space-y-4">
        <Skeleton className="h-7 w-3/4 rounded-xl" />
        <Skeleton className="h-5 w-1/3 rounded-xl" />
        <Skeleton className="h-4 w-full rounded-xl" />
        <Skeleton className="h-4 w-2/3 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-2xl mt-4" />
      </div>
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProductPageClient />
    </Suspense>
  );
}
