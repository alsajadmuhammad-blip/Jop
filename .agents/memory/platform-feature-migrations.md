---
name: Platform feature migrations
description: How database-backed platform features are delivered when the project uses an external Supabase database.
---

New platform features that add tables, columns, policies, or database functions should include a standalone SQL migration alongside the application changes.

**Why:** The project uses an external Supabase database and the workspace does not automatically apply schema changes to that remote database.

**How to apply:** Run the migration after the base schema and candidate-search SQL, then verify the RLS policies with candidate, HR, and admin sessions before release.