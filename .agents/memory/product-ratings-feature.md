---
name: Product ratings feature
description: How product ratings work — components, service, DB requirement, and auth guards
---

## Pattern
Exact same weighted-average approach as store ratings (no separate reviews table).
Rating aggregate stored directly on `products` table: `rating FLOAT DEFAULT 0`, `reviews INTEGER DEFAULT 0`.

## DB requirement (manual step)
Run in Supabase SQL editor before ratings work:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
```

## Auth guards
- Store owner: `ProductRatingWrapper` returns `null` (button hidden entirely)
- Admin: button visible, clicking shows destructive toast, dialog never opens
- Guest / customer: full access

**Why:** Requirement was "available to guests, blocked for store owner AND admin". Owner gets no UI at all; admin gets visible-but-blocked with feedback toast.

## Key files
- `src/services/product-ratings.ts` — `submitProductRating(productId, rating)`
- `src/components/product-rating-wrapper.tsx` — auth-aware button + dialog
- `src/components/product-rating-dialog.tsx` — star dialog UI
- `src/components/dashboard/product-analytics-tab.tsx` — analytics tab (order counts + ratings)

## Dashboard tab
Tab id: `analytics`, label: "التقييمات". Added between "الأقسام" and "الاشتراك" in navbar.
Computes order counts from `fetchStoreOrders` items (quantity summed per productId, cancelled excluded from revenue but not from count).

## Known limitation
Rating updates are non-atomic (read-then-write), same as store ratings. Concurrent submissions could produce drift. Mitigate with Supabase RPC/DB function if high traffic is expected.
