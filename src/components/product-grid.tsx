"use client";

import { memo } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
}

function ProductGridContent({ products }: ProductGridProps) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 auto-rows-fr"
      style={{ contain: "layout style paint" }}
    >
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export const ProductGrid = memo(ProductGridContent);
