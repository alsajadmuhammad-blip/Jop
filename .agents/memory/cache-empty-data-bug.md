---
name: Cache empty-data bug
description: writeStoreCache and setStorePage were caching empty results (network blip), causing "no data" for up to 5 minutes in normal browser (incognito always fresh).
---

## Rule
Both `writeStoreCache` (localStorage, page.tsx) and `setStorePage` (in-memory Map, store-page-cache.ts) must validate before writing: skip the write if `store?.id` is falsy or `products.length === 0`.

**Why:** A transient network error returns empty products; the cache stores that empty result with a 5-minute TTL; every subsequent load reads the empty cache and shows "لا توجد بيانات". Incognito has no localStorage so it always fetches fresh — that is the tell.

**How to apply:** Any future cache write that involves products/store must include the same guard before localStorage.setItem or Map.set.
