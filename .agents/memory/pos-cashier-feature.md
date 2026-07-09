---
name: POS Cashier Feature
description: نقطة البيع الفوري (Cashier/POS) added to store dashboard — architecture and integration notes.
---

## What was built
A full POS (نقطة البيع / كاشير) tab added to the store owner dashboard for physical in-store sales.

## File locations
- Component: `src/components/dashboard/pos-tab.tsx` (`PosTab` export)
- Rendered in: `src/app/(pages)/dashboard/store/page.tsx` when `activeView === 'pos'`
- Navbar: `src/app/(pages)/dashboard/store/navbar.tsx` — "الكاشير" tab in the "المتجر" group

## How it works
1. Store owner selects products from a grid (filtered by section/search) — only in-stock products shown
2. Items added to a cart panel (RTL split layout on desktop, tab switcher on mobile)
3. On sale completion:
   - Calls `createOrder()` from `src/services/supabase-db.ts` with `status: "delivered"` and `paymentMethod: cash|transfer`
   - Manually calls `updateProduct(id, { stock: newStock })` for each cart item to decrement stock
   - Fires `onStockUpdate(productId, newStock)` callback to update parent products state
   - Shows a receipt screen with order summary

## Why manual stock decrement
The `createOrder` in `supabase-db.ts` is a simple INSERT — no auto trigger.
The auto-decrement in `orders.ts::updateOrderStatus` is only triggered when status changes via `updateOrderStatus`, NOT on initial creation.
So POS must manually decrement stock to avoid zero-decrement on "delivered" orders created directly.

## Stock sync
`onStockUpdate` updates the parent `products` state via `setProducts`, keeping the products tab and POS in sync without a full reload.
