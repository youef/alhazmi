# Neon Functions — services for all Diwan modules
This source is a **security-first initial implementation**, not an unrestricted CRUD endpoint.
- `diwanapi`: auth-gated read routes for profile, genealogy, family, requests, service requests, documents, notifications, activity, membership, privacy, claims, family spaces, tasks, quality, history, forms, permissions, roles, approvals, delegations, audit and backups. Sensitive modules require approved active scoped role grants. A request-creation endpoint writes only review requests, **not** canonical genealogical links.
- `diwanfiles`: private bucket uploads with MIME signature validation and 10MB limit. Each object is linked to its verified uploader's person record. Files are **pending review** and downloadable only by the linked person via short-lived presigned URLs. File upload/download uses server-held S3 credentials.
- `GET /health` is public, but has no individual data. All other endpoints verify Neon Auth JWT using remote JWKS and reject suspended users.
- Backend SQL uses parameterized queries, fixed explicit field projections, no dynamic SQL from user input, and no client-supplied role name.
- **Important:** DDL/Neon schema is deployed already, but these Function implementations must be bundled and deployed with `neon deploy` (or Neon MCP function deployment); until then, no live function is being claimed.
- `neon.ts` declares existing Neon Auth and the private uploads bucket alongside both functions.
- This is not yet a production authorization engine: inheritance, workflow, complex delegated scopes and consent have additional requirements. Unimplemented writes to those modules intentionally return 404 rather than bypassing approvals.
- Don't place DB password or S3 credentials in repository.


## Live deployment verification — 15 November 2026
Both functions deployed on Neon `long-truth-63663365` / `br-flat-boat-azy2ouq3` (main), Node.js 24. Initial release encountered a bundle `require('events')` compatibility error and was corrected by adding a Node `createRequire` banner to the esbuild ESM bundle. Final deployment v2 for both functions was confirmed as completed by Neon.

**Live checks (all confirmed, no credentials disclosed):**
- `GET https://br-flat-boat-azy2ouq3-diwanapi.compute.c-3.ap-southeast-1.aws.neon.tech/health` -> `200` / `{"ok":true,"service":"alhazmi-api","version":1,"auth":"required-on-data"}`.
- `GET https://br-flat-boat-azy2ouq3-diwanfiles.compute.c-3.ap-southeast-1.aws.neon.tech/health` -> `200` / `{"ok":true,"service":"alhazmi-uploads","bucket":"private","maxBytes":10485760}`.
- Unauthenticated `GET /v1/me` -> `401` / `Authentication required`.
- Unauthenticated `GET /v1/files` -> `401` / `Authentication required`.

**Not yet established by live end-to-end test:** genuine JWT sign-in & linked family identity; role-specific reads; upload a test PDF/image to Object Storage with a real logged-in user; valid owner download; reviewer approval; multi-role inheritance; each administrative mutation's transaction and audit. Database structures already exist but the production workflow and UI still need completion. Do not label all 119 tables as fully writable or every role and action production-ready.
