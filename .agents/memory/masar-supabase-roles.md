---
name: Masar Supabase roles
description: Durable security rule for the independent Iraqi jobs platform.
---

Supabase client keys used by the browser are public by design. The security boundary for this app is PostgreSQL RLS and Storage policies: admin can manage all records, while an HR account must be matched to its organization before reading or changing CV requests and applications.

**Why:** Hiding dashboard links does not prevent direct Supabase queries, and CV files are private applicant data.

**How to apply:** Any new HR-facing page or query must preserve the organization-based RLS rule and the corresponding private Storage policy; never rely on React role checks alone.

Cross-table RLS checks between `candidate_profiles` and `applications` must use a restricted `security definer` helper rather than querying the other protected table directly inside a policy.

**Why:** The candidate profile access policy checks applications, so a direct candidate profile lookup from an applications policy creates PostgreSQL's infinite RLS recursion error.

**How to apply:** Keep the helper's `search_path` fixed to `public`, have it use `auth.uid()` with no user-id argument, revoke public execution, grant it only to `authenticated`, and apply the standalone Supabase migration before testing internal job applications.