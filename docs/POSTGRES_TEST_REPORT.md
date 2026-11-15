# PostgreSQL 17 database validation — discovered issue and fix

## Verified live in isolated GitHub Actions PostgreSQL
All ten migration files from V1 through V9 executed in timestamp order successfully on PostgreSQL 17 during workflow run [43692922655](https://github.com/youef/alhazmi/actions/runs/43692922655). All structural tests executed before the integration fixture passed.

## Bug identified by the first integration fixture
V1 used `CHECK (father_id IS DISTINCT FROM mother_id)`. When both values are NULL (an unknown-parent or founding ancestor), PostgreSQL evaluates `NULL IS DISTINCT FROM NULL` as FALSE, blocking creation of the person. The integration test caught this.

## Fix
Migration `20261115010000_parentage_null_fix.sql` replaces only that obsolete check constraint with `father_id IS NULL OR mother_id IS NULL OR father_id <> mother_id`, so:
- both missing parents: accepted;
- only one known parent: accepted;
- two different parents: accepted;
- the same person listed as both father and mother: rejected.

Other existing self-parent and cycle protections stay intact.

## Release gate
Do NOT approve production deployment until CI completes with green status, RLS constraints are tested against Supabase Auth and Storage, and consent/field-level server authorization is built and reviewed. CI using simplified `auth.users` is not a full Supabase integration test.
