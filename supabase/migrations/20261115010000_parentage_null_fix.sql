-- V10 corrective migration, found by PostgreSQL 17 CI integration test.
-- V1 created CHECK (father_id IS DISTINCT FROM mother_id).
-- NULL IS DISTINCT FROM NULL evaluates FALSE, rejecting founder/root people
-- who have neither biological parent recorded.
-- Preserve the prohibition on using the SAME known person for both parents.
do $$
declare c record;
begin
 for c in
  select conname,pg_get_constraintdef(oid) as def
  from pg_constraint
  where conrelid='public.people'::regclass and contype='c'
 loop
  if c.def ~* 'father_id IS DISTINCT FROM mother_id'
     and c.def !~* 'father_id IS NULL' then
   execute format('alter table public.people drop constraint %I',c.conname);
  end if;
 end loop;
end $$;

alter table public.people
 add constraint people_known_parents_must_differ
 check (father_id is null or mother_id is null or father_id <> mother_id);

comment on constraint people_known_parents_must_differ on public.people is
 'Founder/unknown-parent records may have NULL parent columns; two known biological parents must be different persons.';

-- Explicit graph-safe parent checks for regression testing.
do $$
begin
 if not exists(
   select 1 from pg_constraint
   where conrelid='public.people'::regclass
     and conname='people_known_parents_must_differ'
 ) then raise exception 'New parentage constraint missing'; end if;
end $$;
