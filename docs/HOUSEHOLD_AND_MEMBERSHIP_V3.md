# V3 — Digital cards, households, relationship history and privacy

## What's added
- Stable internal `person_registry_ids` and `membership_cards`. QR is a random opaque token (only SHA256 hash stored); public link is verified server-side, revocable, rate limited, and displays only fields with valid consent. Membership number is NOT a national ID, authentication credential, or proof of legal identity.
- `family_households` and `household_members` support current, historical, marital and care households. A person may belong to multiple households across dates. A household is not a family tree. Children are linked to biological parents through approved `people.father_id/mother_id` and documented assertions.
- Marriage remains in `marriages` plus `marriage_history`, so ex-spouses, multiple marriages, and children by different partners don't duplicate `people`.
- `person_identifiers_history` records identifier status changes without recording raw national IDs.
- `family_branch_transfers` records approved family/fakhth reassignment; old identity is preserved in history.
- `privacy_consents`, `data_access_grants`, `document_access_logs`, `person_record_claims`: consent, temporary access, document audit, user identity claims.
- `family_timeline` records dated, sourced family events.
- `relationship_paths_cache` keyed by graph revision and authorization-scope hash; `kinship_calculation_logs` logs coarse result only, never names/paths/identifiers. Invalidate caches when ancestry, visibility, access or consent changes.
- `deceased_record_workflows` + `deceased_delegation_reviews`: reviewed change of living status; investigate and revoke/retain dependent delegations on documented basis, NEVER automatically pass authority to eldest male child.
- `person_name_variants` stores documented alternate spelling/transliteration/old name. Keep original name and version history; do not merge persons based on string similarity alone.

## Rules and constraints requiring application logic
1. On new person creation create one `person_registry_ids` record transactionally. Never reuse IDs.
2. Admin approval for household membership, branch transfer, identity claims and death workflows must check tribe/family boundaries, submitted evidence, reviewer separation and actual legal authority.
3. QR view must verify consent valid at request time, and must never expose current address, identity number, private divorce information, unapproved relatives or details of minors.
4. `privacy_consents` is not permission to grant anything on behalf of anyone; first check subject's authority/guardian before accepting.
5. Parentage is never inferred from marriage, guardianship, foster care, step-parent or household membership.
6. Relationship paths must be recomputed for each security scope or invalidated. Hidden relatives should not be exposed through graph shape, caches or counts.
7. Person identifiers must use secret KMS-backed HMAC for deduplication in backend; key rotation and version migrations are separate from this V3 feature.
8. Append-only triggers on audit/history block ordinary update/delete. Strong tamper-evidence requires protected offsite audit/archive and separation of database-owner duties.
9. Validate time range overlap, unit/tribe consistency, family branches and location cycles before production.
10. Public repository is for schema/docs ONLY; store no real names tied to identities, keys or photos here.

## Delivery stage
SQL migration and docs delivered; not executed in connected Supabase. No production API/QR issuance/security policy, no application UI or runtime validation against PostgreSQL. New RLS tables stay closed to frontend by default.
