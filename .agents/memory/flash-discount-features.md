---
name: Flash Sales & Discount Codes
description: Architecture and critical rules for the two promotional features added to Markazi.
---

## Flash Sales
- Table: `flash_sales` (store_id, product_id, flash_price, ends_at, is_active)
- Service: `src/services/flash-sales.ts`
- Dashboard tab: `src/components/dashboard/flash-sales-tab.tsx`
- Countdown hook: `src/hooks/use-countdown.ts`
- Flash data is merged into Product objects at fetch time (`flashPrice`, `flashEndsAt` fields on Product type)
- Merge happens in TWO places: `store-page-client.tsx` (store page) and `cart-provider.tsx` getProductsByIds (cart re-hydration)

## Discount Codes
- Table: `discount_codes` (store_id, code, discount_percent, max_uses, used_count, expires_at, is_active)
- Service: `src/services/discount-codes.ts`
- Dashboard tab: `src/components/dashboard/discount-codes-tab.tsx`
- UI: discount input in checkout dialog inside `cart-sheet.tsx`
- Validation is client-side (acceptable for this market; merchant confirms via WhatsApp)

## Critical Pricing Rule
**Always use `getEffectivePrice()` — not `getDiscountedPrice()` — in any cart/order context.**
Priority: flash price > regular discount > base price.
`getEffectivePrice` is in `src/lib/types.ts`.

**Why:** Flash sale price was silently ignored when `getDiscountedPrice` was used directly — customers saw one price but were charged another.

**Where it's applied:**
- `cart-provider.tsx` totalPrice
- `cart-sheet.tsx` — item display, order items creation, checkout summary, WhatsApp message
