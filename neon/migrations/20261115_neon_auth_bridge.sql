-- Neon-only compatibility adapter; not part of Supabase migrations or generic Postgres CI.
-- Prerequisite: Neon Managed Better Auth has created neon_auth."user".
create schema if not exists auth;
create table if not exists auth.users (
 id uuid primary key references neon_auth."user"(id) on delete cascade,
 created_at timestamptz not null default now()
);
revoke all on schema auth from public;
revoke all on auth.users from public;
-- The historical Supabase-origin migration revokes privileges from these roles.
-- They are NOLOGIN and have NO access; their existence does not authenticate users.
do $$
begin
 if not exists(select 1 from pg_roles where rolname='anon') then
  create role anon nologin;
 end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then
  create role authenticated nologin;
 end if;
end $$;
create or replace function auth.link_verified_neon_user(p_user_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
 if not exists (
   select 1 from neon_auth."user" u
   where u.id=p_user_id and u.banned is distinct from true
 ) then raise exception 'No active verified Neon Auth user with that identifier'; end if;
 insert into auth.users(id) values(p_user_id) on conflict (id) do nothing;
end $$;
revoke all on function auth.link_verified_neon_user(uuid) from public, anon, authenticated;
comment on function auth.link_verified_neon_user(uuid) is
 'Server-only identity linking routine: validate an existing non-banned Neon Auth user, then create the FK registry row';
