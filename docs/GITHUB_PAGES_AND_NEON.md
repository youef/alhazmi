# GitHub Pages and Neon

GitHub Pages hosts static HTML/CSS/JavaScript only. The Next.js app exports pages under `/alhazmi/`. Secrets cannot be stored in client-side JavaScript.

## Current status
- Public site is exportable and does NOT expose private genealogical data.
- Neon has 415 source-attributed lineage units pending review and no person rows at the latest direct database check.
- `diwanapi` and `diwanfiles` Neon Functions provide authenticated backend routes (see `docs/NEON_FUNCTIONS.md`). This milestone does not yet integrate those routes with the frontend.
- Real member login, approved lineage API, and role-specific CRUD require subsequent work and cross-user security testing.

## Publish
1. In Settings > Pages choose Source: GitHub Actions.
2. Merge the feature branch when static export checks pass.
3. Confirm the Publish Diwan to GitHub Pages workflow succeeded.
4. Open https://youef.github.io/alhazmi/ and test navigation.
5. Never publish DATABASE_URL, S3 secrets or a privileged Neon token into Pages or the repository.

## Future data integration
Provide a dedicated server-side endpoint that returns ONLY approved public genealogical units, with constrained CORS and rate limits. Use Neon Auth JWT for private modules and enforce permission scoping on the server and database. GitHub Pages cannot host Next.js Route Handlers; for full dynamic SSR deploy a server instance on Vercel or Render and connect it securely to Neon.
