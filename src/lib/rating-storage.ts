/**
 * Rating Storage Utility
 * Uses localStorage to track anonymous ratings (product & store)
 * so the same browser can't rate twice — but CAN edit their rating.
 * No login required.
 */

const PRODUCT_KEY = "markazi_product_ratings";
const STORE_KEY = "markazi_store_ratings";

type RatingMap = Record<string, number>;

function readMap(key: string): RatingMap {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as RatingMap) : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: RatingMap): void {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {}
}

/* ── Product ratings ─────────────────────── */

export function getStoredProductRating(productId: string): number | null {
  const map = readMap(PRODUCT_KEY);
  return map[productId] ?? null;
}

export function setStoredProductRating(productId: string, rating: number): void {
  const map = readMap(PRODUCT_KEY);
  map[productId] = rating;
  writeMap(PRODUCT_KEY, map);
}

/* ── Store ratings ───────────────────────── */

export function getStoredStoreRating(storeId: string): number | null {
  const map = readMap(STORE_KEY);
  return map[storeId] ?? null;
}

export function setStoredStoreRating(storeId: string, rating: number): void {
  const map = readMap(STORE_KEY);
  map[storeId] = rating;
  writeMap(STORE_KEY, map);
}
