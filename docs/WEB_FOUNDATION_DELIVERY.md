# Web foundation — delivery notes

Implemented on branch `feat/nextjs-foundation`:
- `apps/web`: Next.js 16.4.6 / React 19 / strict TypeScript, Arabic/English root page and four inner route placeholders.
- Responsive heritage-styled CSS, navigation, metadata, language route prefixes and accessibility baseline.
- Safe placeholder `/api/v1/lineage` that returns zero records until source validation, and application-only health route.
- Basic locale unit tests, lint/typecheck/build CI workflow.
- No Neon credentials, no fabricated people, no genealogical source published.
- Existing `supabase/migrations`, `neon/seeds` and SQL tests retained unchanged.

**Not yet implemented**: actual Neon connection/schema inventory, Auth, RBAC/RLS runtime enforcement, person pages, tree visualization, upload, moderation. No claim of production readiness.
