---
name: Masar Supabase roles
description: Durable security rule for the independent Iraqi jobs platform.
---

Supabase client keys used by the browser are public by design. The security boundary for this app is PostgreSQL RLS and Storage policies: admin can manage all records, while an HR account must be matched to its organization before reading or changing CV requests and applications.

**Why:** Hiding dashboard links does not prevent direct Supabase queries, and CV files are private applicant data.

**How to apply:** Any new HR-facing page or query must preserve the organization-based RLS rule and the corresponding private Storage policy; never rely on React role checks alone.