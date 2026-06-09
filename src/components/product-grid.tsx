
"use client";

import { useMemo, memo, useCallback, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ProductQuickView } from "./product-quick-view";

interface ProductGridProps {
    products: Product[];
}

function ProductGridContent({ products }: ProductGridProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleOpenQuickView = useCallback((product: Product) => {
        setSelectedProduct(product);
    }, []);

    const handleCloseQuickView = useCallback(() => {
        setSelectedProduct(null);
    }, []);

    // Memoize product cards to prevent unnecessary re-renders
    const productCards = useMemo(
        () =>
            products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={handleOpenQuickView}
                />
            )),
        [products, handleOpenQuickView]
    );

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6 auto-rows-fr" style={{ contain: 'layout style paint' }}>
                {productCards}
            </div>
            <ProductQuickView
                isOpen={!!selectedProduct}
                onClose={handleCloseQuickView}
                product={selectedProduct}
            />
        </>
    );
}

export const ProductGrid = memo(ProductGridContent);
