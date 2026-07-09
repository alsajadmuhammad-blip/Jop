"use client";

import { memo, useMemo } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export type SmartBadge = "new" | "trending" | "best_deal";

interface ProductGridProps {
  products: Product[];
}

function computeSmartBadges(products: Product[]): Map<string, SmartBadge> {
  const badges  = new Map<string, SmartBadge>();
  const tenDays = 10 * 24 * 60 * 60 * 1000;

  products.forEach(p => {
    if (p.createdAt && Date.now() - new Date(p.createdAt).getTime() < tenDays)
      badges.set(p.id, "new");
  });

  if (products.length >= 6) {
    [...products]
      .filter(p => p.stock > 0 && p.stock <= 20 && !badges.has(p.id))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 2)
      .forEach(p => badges.set(p.id, "trending"));
  }

  const bestDeal = products
    .filter(p => (p.discountPercent ?? 0) >= 20 && !badges.has(p.id))
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))[0];
  if (bestDeal) badges.set(bestDeal.id, "best_deal");

  return badges;
}

function ProductGridContent({ products }: ProductGridProps) {
  const smartBadges = useMemo(() => computeSmartBadges(products), [products]);

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 auto-rows-fr"
      style={{ contain: "layout style paint" }}
    >
      {products.map((product) => (
        <div
          key={product.id}
          className="h-full product-card-wrapper"
        >
          <ProductCard product={product} smartBadge={smartBadges.get(product.id)} />
        </div>
      ))}
    </div>
  );
}

export const ProductGrid = memo(ProductGridContent);
