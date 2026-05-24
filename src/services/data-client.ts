
import type { Category, Store, Product } from "@/lib/types";
import { supabase } from '@/services/supabase';
import { categories as staticCategories } from '@/lib/data';import { mapStoreRow } from '@/services/supabase-db';
// --- Client-Side Store Functions (Supabase) ---

function buildDualIdCondition(columnBase: string, value: string): string {
  const snake = `${columnBase}_id`;
  const camel = `"${columnBase[0].toUpperCase()}${columnBase.slice(1)}Id"`;
  return `${snake}.eq.${value},${camel}.eq.${value}`;
}

async function getProductsForStore(storeId: string): Promise<Product[]> {
    if (!storeId) return [];
    
    // Query products by store_id
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId);

    if (error) {
        console.error('Supabase error fetching products:', error.message);
        return [];
    }

    // Map Supabase record fields to our Product type (fallbacks used)
    return (data || []).map((row: any) => ({
        id: String(row.id),
        name: row.name,
        price: row.price,
        imageUrl: row.image_url || row.imageUrl || '',
        categoryId: row.category_id || row.categoryId,
        storeId: String(row.store_id || row.storeId),
        description: row.description || '',
        sku: row.sku || row.product_sku || undefined,
        stock: typeof row.stock === 'number' ? row.stock : Number(row.stock ?? 0),
    } as Product));
}

export async function fetchStoreData(storeId: string): Promise<{ store: Store | null, categories: Category[] }> {
    // Fetch store row from `stores` table
    const { data: storeRows, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .limit(1);

    if (storeError) {
        console.error('Supabase error fetching store:', storeError.message);
        return { store: null, categories: [] };
    }

    if (!storeRows || storeRows.length === 0) {
        return { store: null, categories: [] };
    }

    const storeRow = storeRows[0];

    const products = await getProductsForStore(storeId);

    const store: Store = {
        ...mapStoreRow(storeRow),
        products,
    };

    const allCategories = staticCategories;

    // Filter categories to only include ones that have products in the current store
    const usedCategoryIds = new Set(products.map(p => p.categoryId));
    const categories = allCategories.filter(c => usedCategoryIds.has(c.id));

    return { store, categories };
}
