import { notFound } from "next/navigation";
import { categories as staticCategories } from "@/lib/data";
import { ProductGrid } from "@/components/product-grid";
import type { Product, Category, Store } from "@/lib/types";
import { BackButton } from "@/components/layout/back-button";
import { supabase } from '@/services/supabase';
import { parseBoolean } from '@/services/supabase-db';

export async function generateStaticParams() {
  return staticCategories.map((category) => ({
    id: category.id,
  }));
}

export const dynamicParams = false;

async function getCategoryProducts(categoryId: string): Promise<Product[]> {
  const { data: storesRows, error: storesError } = await supabase
    .from('stores')
    .select('id, market_type, is_active');

  if (storesError) {
    console.error('Error fetching stores for category page:', storesError);
    return [];
  }

  const activeStoreIds = (storesRows || [])
    .filter((store: any) => parseBoolean(store.is_active ?? store.isActive))
    .filter((store: any) => {
      const type = String(store.market_type || store.marketType || '').toLowerCase();
      return type !== 'restaurant' && type !== 'spare-parts';
    })
    .map((store: any) => store.id);

  if (activeStoreIds.length === 0) {
    return [];
  }

  const { data: productsRows, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .in('store_id', activeStoreIds);

  if (productsError) {
    console.error('Error fetching category products:', productsError);
    return [];
  }

  return (productsRows || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url || row.imageUrl,
    storeId: row.store_id || row.storeId,
    categoryId: row.category_id || row.categoryId,
    sku: row.sku || row.product_sku || undefined,
    stock: typeof row.stock === 'number' ? row.stock : Number(row.stock ?? 0),
  } as Product));
}

export default async function CategoryPage({ params }: { params: { id: string } }) {
  const category = staticCategories.find((c) => c.id === params.id);
  if (!category) {
    notFound();
  }

  const products = await getCategoryProducts(params.id);

  return (
    <div className="bg-card min-h-full">
      <div className="container mx-auto px-4 py-8">
         <div className="absolute top-4 left-4 z-10">
          <BackButton />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-headline">
            {category.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            تصفح جميع المنتجات في قسم {category.name}.
          </p>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="text-center py-16 rounded-lg bg-background">
            <p className="text-muted-foreground">
              لا توجد منتجات في هذا القسم حاليًا.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

    