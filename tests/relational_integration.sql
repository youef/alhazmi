-- Postgres integration fixtures; all rows rolled back. Run AFTER all migrations.
begin;
do $$
declare
 tribe_a uuid:=gen_random_uuid();tribe_b uuid:=gen_random_uuid();
 unit_a uuid:=gen_random_uuid();unit_b uuid:=gen_random_uuid();
 person_a uuid:=gen_random_uuid();person_b uuid:=gen_random_uuid();
 card_uuid uuid; role_a uuid:=gen_random_uuid();role_b uuid:=gen_random_uuid();
 failed boolean;
begin
 insert into public.tribes(id,name_ar) values(tribe_a,'قبيلة اختبار أ'),(tribe_b,'قبيلة اختبار ب');
 insert into public.lineage_units(id,tribe_id,unit_type,name_ar)
 values(unit_a,tribe_a,'family','العائلة أ'),(unit_b,tribe_b,'family','العائلة ب');
 insert into public.people(id,tribe_id,family_unit_id,given_name_ar,full_name_ar)
 values(person_a,tribe_a,unit_a,'شخص','شخص تجريبي أ'),
       (person_b,tribe_b,unit_b,'آخر','شخص تجريبي ب');

 -- Cross-tribe family assignment MUST fail.
 failed:=false;
 begin
   update public.people set family_unit_id=unit_b where id=person_a;
 exception when others then failed:=true;
 end;
 if not failed then raise exception 'Cross-tribe person family link unexpectedly allowed'; end if;

 -- Cross-tribe lineage parent MUST fail.
 failed:=false;
 begin
   update public.lineage_units set parent_id=unit_b where id=unit_a;
 exception when others then failed:=true;
 end;
 if not failed then raise exception 'Cross-tribe branch parent unexpectedly allowed'; end if;

 -- Parentage cycle needs approved assertions and must still be refused.
 insert into public.parentage_assertions(child_id,parent_id,parent_role,status)
 values(person_a,person_b,'father','approved');
 update public.people set father_id=person_b where id=person_a;
 insert into public.parentage_assertions(child_id,parent_id,parent_role,status)
 values(person_b,person_a,'father','approved');
 failed:=false;
 begin
   update public.people set father_id=person_a where id=person_b;
 exception when others then failed:=true;
 end;
 if not failed then raise exception 'Parentage cycle unexpectedly allowed'; end if;

 -- Permanent registry ID may not be rewritten.
 insert into public.person_registry_ids(person_id) values(person_a);
 failed:=false;
 begin
   update public.person_registry_ids set member_number=88888 where person_id=person_a;
 exception when others then failed:=true;
 end;
 if not failed then raise exception 'Permanent registry identity unexpectedly editable'; end if;

 -- Inheritance cannot cycle.
 insert into public.custom_roles(id,role_key,name_ar,max_scope,role_state)
 values(role_a,'test_role_a','دور اختبار ألف','family','active'),
       (role_b,'test_role_b','دور اختبار باء','family','active');
 insert into public.role_inheritance(child_role_id,parent_role_id)
 values(role_a,role_b);
 failed:=false;
 begin
  insert into public.role_inheritance(child_role_id,parent_role_id) values(role_b,role_a);
 exception when others then failed:=true;
 end;
 if not failed then raise exception 'Role inheritance cycle unexpectedly allowed'; end if;

 raise notice 'Relational negative tests passed';
end $$;
rollback;
