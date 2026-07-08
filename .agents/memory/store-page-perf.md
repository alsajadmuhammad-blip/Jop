---
name: Store page performance
description: What was done to make the store page faster and the rules that must stay consistent
---

## Changes made

### next.config.js
Removed custom `webpack` splitChunks block that was collapsing all vendor packages into one `vendor.js` chunk — this broke Next.js's automatic code splitting. Default Next.js chunking is better; don't re-add a custom splitChunks override.

### Store page in-memory cache (`src/services/store-page-cache.ts`)
2-minute TTL Map-based cache keyed by storeId. Stale-while-revalidate:
- Cache hit → show immediately, background refresh products after 300ms.
- Cache miss → fetch all 4 endpoints in parallel as before.
- Background refresh guarded by `refreshingStores: Set<string>` (per-storeId, not global boolean).
- Effect cleanup sets `cancelled = true` and `clearTimeout(refreshTimer)` to prevent stale writes on storeId change or unmount.

**Why:** Every navigation to a store was firing 4 parallel Supabase calls from scratch. Cache eliminates loading spinner on return visits.

### ProductGrid (`src/components/product-grid.tsx`)
- `STAGGER_LIMIT = 8`: first 8 cards get spring stagger (0.04s each), rest appear instantly.
- Removed expensive `key={products.map(p=>p.id).join(",")}` that caused full grid re-mount on any filter/sort change; each card now keyed by stable `product.id`.

**Why:** 50 products × 0.04s stagger = last card starts 2s late. Grid re-mount on sort was causing all 50 cards to re-animate every time.

### ProductCard (`src/components/product-card.tsx`)
Removed all Framer Motion from individual cards:
- `motion.button whileTap` → CSS `active:scale-90 transition-all duration-150`
- `AnimatePresence` + `motion.span` for cart↔check icon → simple conditional render with CSS `transition-all duration-150`
- Smart badge `motion.div` → plain `div` with Tailwind `animate-in fade-in zoom-in-90`

**Why:** 50+ cards each mounting their own Framer Motion instances created significant JS overhead.

### Search debounce (`src/app/(pages)/store/store-products-section.tsx`)
Two states: `searchInput` (raw, drives input value) and `search` (debounced 180ms, drives useMemo filter). useEffect with clearTimeout cleanup.

**Why:** Every keystroke was recomputing `useMemo` over all products and triggering ProductGrid re-animation.

## Rules to maintain
- Do NOT re-add custom webpack splitChunks to next.config.js.
- Store page cache `cancelled` flag + `clearTimeout` cleanup must stay in the useEffect return to prevent cross-store data races.
- `refreshingStores` must remain a `Set<string>` keyed by storeId (not a single boolean).
- STAGGER_LIMIT should stay ≤ 10 to keep perceived load time acceptable.
