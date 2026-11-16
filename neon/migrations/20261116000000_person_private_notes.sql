-- Add an encrypted administrator-only long notes field. No existing rows or links are changed.
alter table public.person_private add column if not exists private_notes_ciphertext bytea;
comment on column public.person_private.private_notes_ciphertext is 'AES-256-GCM encrypted private genealogy notes; never expose in public pages';
