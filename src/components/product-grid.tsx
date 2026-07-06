"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 22,
    },
  },
};

function ProductGridContent({ products }: ProductGridProps) {
  return (
    <motion.div
      key={products.map(p => p.id).join(",")}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 auto-rows-fr"
      style={{ contain: "layout style paint" }}
    >
      {products.map(product => (
        <motion.div key={product.id} variants={cardVariants} className="h-full">
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export const ProductGrid = memo(ProductGridContent);
