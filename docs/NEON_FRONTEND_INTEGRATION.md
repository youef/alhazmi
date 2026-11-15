# Neon Frontend Integration — incremental status

## Changes implemented
- New public GET `/v1/public/lineage?limit=50&offset=0` on `diwanapi` backend: exposes only `lineage_units` that have an **approved** `lineage_seed_reviews` entry with a non-null `verified_at`.
- The endpoint returns only unit id, parent id, type, Arabic/English name; no individual people, identity data, docs, phone, email, or unreviewed branches. Returns pagination and a small public cache TTL.
- Browser CORS restricted to `https://youef.github.io` and `http://localhost:3000`.
- Static Next.js Pages branches and lineage routes use client-side fetch, retry/loading/empty states and search.
- Previously, direct Neon read showed 415 lineage units, all 415 review entries marked `needs_review`, 0 people. Therefore a correctly deployed public endpoint returns **zero** visible records until reviewers approve entries. This is intentional.
- The endpoint change must be built and **deployed to Neon Functions** before the browser works; adding code to GitHub does not auto-update Neon deployments. Confirm live HTTP 200 and CORS before declaring the integration live.

## Unfinished / production blockers
- Actual Neon Auth sign-in and secure JWT acquisition, session refresh and logout in the frontend.
- Authorized personal modules, linked profile, request submission, role management, admin review UX, audit/consent.
- True interactive person tree, approved lineage review process and private Object Storage upload.
- GitHub Pages cannot run Next.js server-side. A full authenticated app may be better hosted on Vercel/Render while GitHub Pages serves public landing pages.
- Never place DATABASE_URL, privileged API keys, S3 access keys or JWTs in the repository or static JS.
- Never mark `needs_review` records as `approved` automatically.

## Deployment acceptance tests
1. `GET /health` remains 200 on diwanapi.
2. `GET /v1/public/lineage?limit=50&offset=0` returns status 200 with zero entries until genuine review.
3. OPTIONS preflight from allowed origin includes `Access-Control-Allow-Origin`; disallowed origins are not authorized by CORS.
4. Existing unauthenticated private requests still return 401.
5. npm CI (lint, typecheck, tests, build) and GitHub Pages deploy both succeed.
6. GitHub Pages displays honest empty/connection errors without leaking private records.
