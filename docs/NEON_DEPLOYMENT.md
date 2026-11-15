# Neon deployment — alhazmi — 15 Nov 2026

## Live project
- Neon project: `alhazmi`
- Project ID: `long-truth-63663365`
- Branch: `main` (`br-flat-boat-azy2ouq3`)
- Database: `alhazmi`
- Region: `aws-ap-southeast-1` (Singapore)
- PostgreSQL version: 17
- Console: https://console.neon.tech/

## Actual deployment evidence
- All 11 SQL migrations V1 through V10 applied successfully.
- Live queries: **119 public tables**, **119 RLS-enabled public tables**, **335 foreign-key constraints**.
- Neon Auth Better Auth provisioned on this branch with `neon_auth` schema.
- Structural schema, V8 roles, V9 service checks passed on Neon.
- Transaction-isolated negative relationship tests passed; fixture writes rolled back.
- `auth.users` compatibility registry exists with a **foreign key to `neon_auth."user"(id)`**. Its UUID keys correspond to Neon Auth IDs.
- `anon` and `authenticated` exist as **NOLOGIN compatibility roles**, not authenticating database clients.
- Function `auth.link_verified_neon_user(uuid)` lets a **trusted backend using privileged database credentials** create a compatibility link after validating that the Neon Auth user exists and is not banned. Rejected an unrecognized UUID in a live negative test.

## Neon Auth compatibility and outstanding app work
Unlike Supabase Auth, Neon Auth accounts are stored in `neon_auth."user"`. The public registry's existing foreign keys were intentionally **not dropped**. The server must call `auth.link_verified_neon_user(id)` when onboarding each verified Neon Auth account. Merely creating a Neon Auth account does not yet create the registry row automatically. Use a trusted server process, never expose database owner credentials or the registry-linking SQL to the browser.

All new application tables remain **deny by default**: there are no authenticated-user RLS policies or complete application API yet. The actual signup/login screens, user role editor, family data APIs, document authorization, encrypted field storage, and identity checks are still unimplemented.

The SQL has been verified structurally and in transaction-isolated fixtures. **Do not put real national IDs, family documents, or minors' records into public-facing features until an independent security review, role-aware server APIs, and storage access policies are implemented and tested.**

## Migration differences
To run the Supabase-origin DDL safely on Neon:
1. Provision Neon Auth (Better Auth) on the Neon branch.
2. Create a secure compatibility schema `auth.users` with UUID FK to `neon_auth."user"(id)`.
3. Create NOLOGIN `anon`/`authenticated` only for compatibility with older migration REVOKE statements; they do not provide Neon authentication or access.
4. Apply all existing migrations V1..V10 in order.
5. Create the protected server-only linking routine in `neon/migrations/20261115_neon_auth_bridge.sql`, and keep the browser's DB grants denied.
6. Run schema and negative integration tests without leaving synthetic fixture records.

Do not run the Neon adapter migration on Supabase or on the PostgreSQL CI fixture without the managed Neon Auth schema.
