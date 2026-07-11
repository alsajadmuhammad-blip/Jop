---
name: Store owner navigation architecture
description: How the store-owner mobile bottom bar syncs with the dashboard's tab state, and where the global contact button lives.
---

The store role has its own bottom bar (rendered from the global `BottomNavbar` component, early-returned for `userRole === 'store'`), separate from the dashboard's own top header/tabs (`StoreOwnerNavbar` in the dashboard page). These two must stay in sync via the `?tab=` query param on `/dashboard/store` — the dashboard's tab-change handler calls `router.replace` to update that param, and the bottom bar reads it via `useSearchParams` (wrapped in its own `<Suspense>` since it's mounted outside any page-level Suspense boundary).

**Why:** the bottom bar and the dashboard page are separate component trees (bottom bar lives in the root providers, dashboard tabs are local page state), so URL state is the only shared channel between them without prop drilling.

**How to apply:** if the dashboard adds/renames tabs, update both the tab→group mapping in `bottom-navbar.tsx` and the `validViews` list in the dashboard page together, or the bottom bar's active-state highlighting will silently drift out of sync.

Site-wide "contact us" is a floating action button (`floating-contact-button.tsx`, mounted in `providers.tsx`) rather than a header/nav link — it was intentionally pulled out of the header to declutter it. Keep it on the opposite screen edge from `pwa-install.tsx` / `push-notification-prompt.tsx` (those anchor right; the contact FAB anchors left) to avoid overlap.
