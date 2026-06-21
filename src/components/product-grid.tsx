
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
            <div className="grid grid-cols-2 gap-3">
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
