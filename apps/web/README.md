# Alhazmi Diwan — Next.js Foundation

First executable frontend scaffold for the existing `youef/alhazmi` PostgreSQL and genealogy project.

## Setup
- Node.js 20.9+ (prefer an active LTS version)
- From the repository root: `npm install`
- Start: `npm run dev`
- Typecheck: `npm run typecheck`
- Unit tests: `npm test`
- Build: `npm run build`
- Open `http://localhost:3000/ar` or `/en`.

## Safety
This milestone only displays non-personalized placeholder content. It **does not** connect to Neon or publish draft lineage data. `/api/v1/lineage` deliberately returns an empty response with `not_connected`. `/api/v1/health` reports application reachability only, not database health.

## Next steps
1. Inventory live Neon schema in an isolated environment.
2. Map reviewed, public lineage units to a read-only server repository.
3. Implement Neon Auth session + authorization + RLS tests.
4. Add approved tree slices, private-person access, and moderation.

## Vercel
Root Directory: `apps/web`. Install/build should follow npm workspaces; if Vercel cannot resolve workspace dependencies from nested root, select repository root and use project scripts with the correct output/config. Set production environment variables via Vercel project settings, never commit them.
