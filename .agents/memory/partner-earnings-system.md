---
name: Partner earnings system
description: How partner/representative salary, commission, and package-point goals are calculated and stored.
---

## Architecture
Earnings calculation is centralized in `src/app/api/partner-activation/route.ts` (Next.js API route).
Called from admin page after store activation with the admin's Supabase JWT in Authorization header.

## package_points (key new feature)
- Stored as JSONB in `users.package_points`: `{ [package_id]: number_of_points }`
- Per-partner override — different partners can assign different point values to the same package
- Defaults to 1 point if no entry exists for the package
- Editable from admin's PartnersTab > EditPartnerDialog (shows all active packages with point inputs)

## Salary system logic (payment_system = 'salary')
- `required_stores_count` is the GOAL in POINTS (not store count) — label is misleading but kept for DB compat
- When `monthly_activations` crosses from < required to >= required → monthly_salary is added ONCE
- If same activation pushes PAST the goal → commission_percent is also added for the overage
- Every activation AFTER the goal → commission_percent of package price
- `required_stores_count` MUST be > 0 for salary mode — if 0, no earnings are calculated (guard in API)

## Commission system (payment_system = 'commission')
- commission_percent of package price on EVERY activation, no goal involved

## Monthly reset
- `users.last_reset_date` tracks the last reset month
- If current month ≠ last_reset_date month → monthly_activations resets to 0 before adding new points
- Reset is applied silently inside the API route, not as a separate cron job

## Security
- API route verifies caller via Supabase JWT (Authorization: Bearer <token>)
- Checks user.role = 'admin' in users table
- Idempotency: only processes if store.activation_date is within last 15 minutes
- Admin page fetches session token via `supabase.auth.getSession()` and passes it in Authorization header

**Why:** The old inline logic in admin/page.tsx had no auth, no idempotency, used global target_points from store_packages instead of per-partner package_points, and didn't add salary at goal-crossing (only commission after goal).

**How to apply:** Any time store activation triggers partner earnings, call POST /api/partner-activation with { store_id } and Authorization header. Do NOT do inline earnings math elsewhere.
