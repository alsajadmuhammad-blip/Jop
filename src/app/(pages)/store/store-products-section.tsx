"use client";

import { useMemo, useState, memo, useCallback, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ProductGrid } from "@/components/product-grid";
import type { Product, Section } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

function StoreProductsSectionContent({ products, sections, store }: StoreProductsSectionProps) {
  const [activeSection, setActiveSection] = useState<string>("all");
  const [, startTransition] = useTransition();

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (a.isFeatured === b.isFeatured) return 0;
      return a.isFeatured ? -1 : 1;
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeSection === "all") return sortedProducts;
    return sortedProducts.filter((p) => p.sectionId === activeSection);
  }, [sortedProducts, activeSection]);

  const handleSectionChange = useCallback((id: string) => {
    startTransition(() => setActiveSection(id));
  }, []);

  const hasSections = sections.length > 0;

  return (
    <div id="store-products">

      {/* ── شريط الأقسام — خارج الـ Card تماماً ── */}
      {hasSections && (
        <div
          style={{
            width: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              gap: "8px",
              paddingBottom: "4px",
              paddingRight: "4px",
              paddingLeft: "4px",
            }}
          >
            {/* زر الكل */}
            <button
              onClick={() => handleSectionChange("all")}
              style={{
                flexShrink: 0,
                whiteSpace: "nowrap",
                padding: "6px 18px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                transition: "all 0.15s",
                background: activeSection === "all" ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: activeSection === "all" ? "#fff" : "hsl(var(--muted-foreground))",
              }}
            >
              الكل
            </button>

            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleSectionChange(sec.id)}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "6px 18px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s",
                  background: activeSection === sec.id ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: activeSection === sec.id ? "#fff" : "hsl(var(--muted-foreground))",
                }}
              >
                {sec.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── بطاقات المنتجات ── */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-4 sm:p-6">
          {filteredProducts.length === 0 ? (
            <div className="py-12">
              <p className="text-center text-sm text-slate-600">
                لا توجد منتجات حالياً في هذا القسم.
              </p>
            </div>
          ) : (
            <ProductGrid products={filteredProducts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const StoreProductsSection = memo(StoreProductsSectionContent);
