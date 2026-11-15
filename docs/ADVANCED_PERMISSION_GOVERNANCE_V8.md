# V8 — Fine-grained permissions and workflow governance

## Delivered schema
- `role_inheritance`: explicitly enabled, reviewed role-to-role inheritance with cycle checks and no wider scope inheritance.
- `permission_overrides`: expiring per-user allow/deny exceptions; deny wins and allow can never expand the user's base scope or expose private fields without separate authorization.
- `scope_boundaries`: optional branch scope and subtree/exclusion restrictions.
- `approval_workflows`, `approval_workflow_steps`, `approval_workflow_instances`, `approval_workflow_decisions`: configurable multistep approvals, minimum reviewers and separation of duties.
- `temporary_delegations`: limited-time, non-redelegable subsets of already-held permissions; intended temporary absence coverage.
- `automation_rules`, `automation_executions`: allowlisted event triggers with idempotency; no arbitrary user-defined SQL or code execution.
- `security_sessions`: session metadata for user activity dashboard.
- `permission_simulations`: recorded decisions for a read-only "can user X do Y on resource Z?" tool.
- `administrative_tenures`: historical officer appointments.
- `record_quality_reviews`: sourced review of missing, verified, disputed, or unverified records.

## Granular authorization checks to implement
**Example role: مشرف العائلة** with `family.read`, `person.create`, `person.edit`, but DENY `person.delete`, `lineage.approve`, `person.export`, `identity.read`, `identity.edit`.

Every protected API operation must evaluate, in order:
1. authenticated and active account; revocation and session freshness;
2. permission enabled and role active, assignment approved, in date range, not revoked;
3. intersect inherited permission grants with assigned scope and branch boundaries;
4. explicit deny overrides allow; a custom allow override cannot create authority absent a valid base grant;
5. target scope, tribe, family, dependent care proof, subject consent/privacy, and purpose;
6. critical operation needs an independent approval workflow and immutable audit;
7. field-level filtering before any response, including search, kinship graphs, exports and stats.

**Do not evaluate permissions from JWT user_metadata, UI toggles, or role names.** Use server-trusted database state. RLS on these tables remains deny-by-default until explicit audited policies are deployed.

## Workflow example: change grandfather name
1. Submit request and evidence.
2. Family moderator reviews.
3. Genealogist verifies source.
4. Independent authorized approver decides.
5. In one backend transaction update canonical record, append revision log, invalidate ancestry cache, emit idempotent notification event.

## Engine implementation backlog (not built in this migration)
- Express/Next.js server permission evaluator and role editing endpoints.
- Deny-override and role-inheritance graph traversal with max depth, cycle handling, runtime scope intersection.
- Approval workflow runtime with separation of duties and step-to-instance matching.
- Deferred rule executor (queue/worker), retries/backoff, monitoring and cancellation.
- Device sessions backed by real Supabase Auth sessions and revocation.
- Permission simulator API with masked targets, policy version and no side effects.
- Editable Arabic administration UI with page/action/field granularity.
- Negative integration tests: self-grant, cross-family reads, expired roles/delegations, inheritance of critical rights, approvals by request creator, private export, hidden person in kinship path.

## Not production-ready
New migrations are uploaded to GitHub only. No connected database was modified or verified using real PostgreSQL. RLS tests and application-level permission enforcement are still pending. Never ingest real national IDs, children's data or confidential family records into an unvalidated instance.
