git add .env.example
git add README.md
git add components.json
git add eslint.config.js
# next.env.d.ts (Firebase Studio settings)

This project has been migrated towards a frontend-only architecture. Server-side Firebase Functions and Admin SDK have been deprecated in favor of Supabase for backend responsibilities (auth/data). The legacy `storage.rules` file was archived/removed — storage is handled by Supabase Storage. See migration notes in docs/blueprint.md.

To get started, take a look at src/app/page.tsx.
