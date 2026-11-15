-- Verification of a source and approval for public release are distinct states.
-- Existing records retain their review status.
alter table public.lineage_seed_reviews
  drop constraint lineage_seed_reviews_review_status_check,
  add constraint lineage_seed_reviews_review_status_check
    check (review_status in ('needs_review', 'verified', 'approved', 'disputed', 'rejected')),
  add constraint lineage_publication_requires_reviewer
    check (review_status <> 'approved' or (verified_by is not null and verified_at is not null));
