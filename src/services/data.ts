
import type { Category, Store, Product } from "@/lib/types";
import { supabase } from '@/services/supabase';
import { categories as staticCategories } from '@/lib/data';
import { unstable_noStore as noStore } from 'next/cache';

// --- This file is now intended for server-side data fetching if ever needed, ---
// --- but most data fetching has been moved to client components. ---


// --- Category Functions ---
export function getCategories(): Category[] {
    // This is a static list, so no need for server-side fetching.
    return staticCategories;
}

// --- Page-specific Data Fetchers (Example for server-side rendering if needed in future) ---

async function getStore(id: string): Promise<Store | null> {
    noStore(); // Ensures data is fetched on every request

    const { data: storeRow, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

    if (storeError) {
        console.error('Failed to fetch store for server-side rendering', storeError);
        return null;
    }

    if (!storeRow) return null;

    const { data: productsRows, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', id);

    if (productsError) {
        console.error('Failed to fetch products for store', productsError);
        return { id: storeRow.id, ...storeRow, products: [] } as Store;
    }

    const products: Product[] = (productsRows || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        imageUrl: row.image_url || row.imageUrl,
        storeId: row.store_id || row.storeId,
        categoryId: row.category_id || row.categoryId,
    }));

    // Map store fields (snake_case in DB) to frontend Store type where necessary
    const store: Store = {
        id: storeRow.id,
        name: storeRow.name,
        description: storeRow.description,
        logoUrl: storeRow.logo_url || storeRow.logoUrl,
        coverImageUrl: storeRow.cover_image_url || storeRow.coverImageUrl,
        rating: storeRow.rating || 0,
        reviews: storeRow.reviews || 0,
        location: storeRow.location || '',
        latitude: storeRow.latitude ?? null,
        longitude: storeRow.longitude ?? null,
        type: storeRow.type,
        marketType: storeRow.market_type || storeRow.marketType || '',
        businessHours: storeRow.business_hours || storeRow.businessHours,
        products,
        whatsappNumber: storeRow.whatsapp_number || storeRow.whatsappNumber,
        hasDelivery: storeRow.has_delivery || storeRow.hasDelivery || false,
        isActive: storeRow.is_active || storeRow.isActive || false,
        productLimit: storeRow.product_limit || storeRow.productLimit || Number.MAX_SAFE_INTEGER,
        subscriptionDuration: storeRow.subscription_duration || storeRow.subscriptionDuration || 0,
        activationDate: storeRow.activation_date || storeRow.activationDate || null,
        ownerId: storeRow.owner_id || storeRow.ownerId || null,
        ownerEmail: storeRow.owner_email || storeRow.ownerEmail,
        password: storeRow.password,
        createdAt: storeRow.created_at || storeRow.createdAt || null,
        registeredByAgentId: storeRow.registered_by_agent_id || storeRow.registeredByAgentId || null,
    } as Store;

    return store;
}


export async function fetchStoreData(storeId: string): Promise<{ store: Store | null, categories: Category[] }> {
    noStore();
    const store = await getStore(storeId);
    const allCategories = getCategories();

    if (!store) {
        return { store: null, categories: [] };
    }

    // Filter categories to only include ones that have products in the current store
    const usedCategoryIds = new Set(store.products.map(p => p.categoryId));
    const categories = allCategories.filter(c => usedCategoryIds.has(c.id));

    return { store, categories };
}
