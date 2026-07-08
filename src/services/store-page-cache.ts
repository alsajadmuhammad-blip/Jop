/**
 * Store Page In-Memory Cache
 * Caches fetched store data for the duration of the browser session.
 * Prevents 4 parallel API calls on every navigation to the same store.
 *
 * Strategy: stale-while-revalidate with a 2-minute TTL.
 * - On cache hit  → return stale data immediately, refresh silently in background.
 * - On cache miss → fetch normally, store result.
 */

import type { Product, Section, Store } from "@/lib/types";

const TTL_MS = 2 * 60 * 1000; // 2 minutes

interface StorePageData {
  store: Store;
  products: Product[];
  sections: Section[];
}

interface CacheEntry extends StorePageData {
  fetchedAt: number;
}

const _cache = new Map<string, CacheEntry>();

export function getStorePage(storeId: string): StorePageData | null {
  const entry = _cache.get(storeId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    _cache.delete(storeId);
    return null;
  }
  return { store: entry.store, products: entry.products, sections: entry.sections };
}

export function setStorePage(storeId: string, data: StorePageData): void {
  _cache.set(storeId, { ...data, fetchedAt: Date.now() });
}

/** تحديث المنتجات فقط (بعد refresh صامت) دون مسح الكاش كاملاً */
export function updateStoreProducts(storeId: string, products: Product[]): void {
  const entry = _cache.get(storeId);
  if (entry) _cache.set(storeId, { ...entry, products, fetchedAt: Date.now() });
}
