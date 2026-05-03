
"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ProductQuickView } from "./product-quick-view";

interface ProductGridProps {
    products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleOpenQuickView = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleCloseQuickView = () => {
        setSelectedProduct(null);
    };

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                {products.map((product) => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onQuickView={handleOpenQuickView}
                    />
                ))}
            </div>
            <ProductQuickView 
                isOpen={!!selectedProduct}
                onClose={handleCloseQuickView}
                product={selectedProduct}
            />
        </>
    );
}
