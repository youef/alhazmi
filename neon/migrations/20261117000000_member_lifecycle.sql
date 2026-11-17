begin;
alter table public.user_profiles drop constraint user_profiles_account_status_check;
alter table public.user_profiles add constraint user_profiles_account_status_check
  check (account_status in ('pending','active','suspended','frozen','archived'));
insert into public.custom_roles(role_key,name_ar,description_ar,is_system,role_state,max_scope)
values
 ('diwan_fakhth_leader','قائد فخذ','قيادة الفخذ ضمن صلاحيات الإشراف القائمة',false,'active','unit'),
 ('diwan_family_leader','قائد عائلة','قيادة العائلة ضمن صلاحيات الإشراف القائمة',false,'active','family')
on conflict do nothing;

insert into public.custom_role_permissions(role_id,permission_id,decision)
select leader.id,p.id,'allow'
from public.custom_roles leader
cross join public.permission_catalog p
where leader.role_key in ('diwan_fakhth_leader','diwan_family_leader') and not leader.is_system
  and p.is_active and p.permission_key in ('lineage.propose','family.read','selfservice.submit')
on conflict do nothing;
commit;
