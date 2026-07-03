---
name: Store dashboard cache strategy
description: How the store owner dashboard avoids spinner flash while keeping data fresh
---

## The Rule
Use **stale-while-revalidate** — never block the user on a spinner when a valid cache exists.

## How to Apply
1. `useLayoutEffect` (runs before first paint) reads `localStorage` cache keyed `markazi_store_<userId>` with 5-min TTL and populates all state (`store`, `products`, `sections`, `loading=false`, `sessionRestored=true`) instantly.
2. `useEffect` always calls `loadStore(silent=true)` afterward — refreshes from network without showing a spinner.
3. `loadStore(silent)` skips `setLoading(true)` when `silent=true`, and skips the error toast on silent failures.
4. After every local mutation (delete product, create/delete section, settings change, logo save) call `clearStoreCache(userId)` so stale data isn't served on next navigation.
5. A second `useLayoutEffect` with `prevUserIdRef` resets all state when `user.id` changes (cross-account edge case).

**Why:** The original code used `sessionStorage` (cleared on tab close) and always showed a spinner on mount, causing jarring UX on page navigation or tab reopen.

**Cache helpers:** `readStoreCache`, `writeStoreCache`, `clearStoreCache` — defined at module level in `dashboard/store/page.tsx`. TTL = 5 minutes (`STORE_CACHE_TTL`).
