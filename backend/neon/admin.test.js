
import assert from 'node:assert/strict';
import { beforeEach, afterEach, test } from 'node:test';
import { adminAction, adminData, csrfFor } from './admin.js';
import { adminView } from './admin-views.js';
import { pool } from './shared.js';

const member = {id:'11111111-1111-4111-8111-111111111111',person_id:null,tribe_id:null};
const base='https://members.example.test';
const cookie='__Secure-neon-auth.session_token=fixture';
const req=(path='/admin',options={})=>new Request(base+path,{headers:{Cookie:cookie,Origin:base},...options});
let savedQuery,savedConnect,scope;
beforeEach(()=>{
  process.env.NEON_AUTH_COOKIE_SECRET='test-secret-not-used-in-production';
  savedQuery=pool.query;
  savedConnect=pool.connect;
  scope='system';
  pool.query=async(sql,args)=>{
    if(sql.includes('user_custom_role_assignments a')&&sql.includes('crp.decision'))return {rows:[{decision:'allow',scope_type:scope}]};
    if(sql.includes('permission_overrides o'))return {rows:[]};
    if(sql.includes('select count(*)'))return {rows:[{total:'0'}]};
    return {rows:[]};
  };
});
afterEach(()=>{pool.query=savedQuery;pool.connect=savedConnect;});

test('administration requires an approved system scope',async()=>{
  scope='tribe';
  await assert.rejects(()=>adminData(member,'overview',new URL(base+'/admin')),error=>error.status===403);
  scope='system';
  const result=await adminData(member,'overview',new URL(base+'/admin'));
  assert.equal(result.data.metrics.length,7);
  assert.deepEqual(result.data.metrics,[0,0,0,0,0,0,0]);
});

test('administrative view escapes untrusted member data',()=>{
  const suspicious='Member<img src=x onerror=alert(1)>';
  const html=adminView('members',{name:'Admin'},{
    canManage:true,rows:[{id:'11111111-1111-4111-8111-111111111111',name:suspicious,email:'bad<script>execute()</script>@test.com',
      verified:true,account_status:'active',is_admin:false,created_at:'2026-11-15T00:00:00.000Z'}],total:1,page:1,limit:18
  },{page:1,status:'',q:''},'f'.repeat(64));
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html,/<script>execute\(\)<\/script>/);
  assert.match(html,/name="csrf"/);
});

test('CSRF token is stable across cookie refresh but required for POST actions',async()=>{
  const token=csrfFor(member,req());
  assert.equal(token.length,64);
  assert.equal(csrfFor(member,new Request(base+'/admin',{headers:{Cookie:'refreshed'}})),token);
  const form=new URLSearchParams({operation:'review_request',id:'22222222-2222-4222-8222-222222222222',
    expected:'submitted',next:'triage',note:'Verified supporting evidence'});
  await assert.rejects(()=>adminAction(member,'requests',req(),form),error=>error.status===403);
});

test('cannot suspend own admin account, and rolls back transaction',async()=>{
 const log=[];
 pool.connect=async()=>({query:async(sql)=>{log.push(sql);return {rows:[]}},release(){}});
 const form=new URLSearchParams({operation:'change_member',csrf:csrfFor(member,req()),id:member.id,
   state:'suspended',confirm:'yes'});
 await assert.rejects(()=>adminAction(member,'members',req('/admin/members'),form),error=>error.status===403);
 assert.deepEqual(log,['begin','rollback']);
});

test('review changes require a note and write an atomic audit entry',async()=>{
 const log=[];
 pool.connect=async()=>({query:async(sql)=>{
   log.push(sql);
   if(sql.includes('update public.change_requests'))return {rows:[{id:'22222222-2222-4222-8222-222222222222'}]};
   return {rows:[]};
 },release(){}});
 const form=new URLSearchParams({operation:'review_request',csrf:csrfFor(member,req()),
   id:'22222222-2222-4222-8222-222222222222',expected:'submitted',
   next:'triage',note:'Reviewed the presented documents'});
 const target=await adminAction(member,'requests',req('/admin/requests'),form);
 assert.equal(target,'/admin/requests?done=1');
 assert.equal(log[0],'begin');
 assert.ok(log.some(x=>x.includes('insert into public.permission_audit_events')));
 assert.equal(log.at(-1),'commit');
});

test('stale request review cannot overwrite newer decisions',async()=>{
 const log=[];
 pool.connect=async()=>({query:async(sql)=>{log.push(sql);return {rows:[]}},release(){}});
 const form=new URLSearchParams({operation:'review_request',csrf:csrfFor(member,req()),
 id:'22222222-2222-4222-8222-222222222222',expected:'submitted',
 next:'rejected',note:'Required documentation was not provided'});
 await assert.rejects(()=>adminAction(member,'requests',req('/admin/requests'),form),err=>err.status===409);
 assert.equal(log.at(-1),'rollback');
 assert.ok(!log.some(sql=>sql.includes('insert into public.permission_audit_events')));
});

test('private kinship tree shows named grandparents and derives relatives without inventing uncles',()=>{
 const people=[
  {id:'gf',given_name_ar:'رطيان',full_name_ar:'رطيان مطر',record_status:'under_review',gender:'male',family_name:'الشجارين'},
  {id:'gm',given_name_ar:'هله',full_name_ar:'هله مطير',record_status:'under_review',gender:'female',family_name:'الحضيري'},
  {id:'dad',given_name_ar:'ثنيان',full_name_ar:'ثنيان رطيان',father_id:'gf',mother_id:'gm',record_status:'under_review',gender:'male'},
  {id:'uncle',given_name_ar:'محمد',full_name_ar:'محمد رطيان',father_id:'gf',mother_id:'gm',record_status:'under_review',gender:'male'},
  {id:'mom',given_name_ar:'السمراء',full_name_ar:'السمراء سالم',record_status:'under_review',gender:'female'},
  {id:'self',given_name_ar:'يوسف',full_name_ar:'يوسف ثنيان',father_id:'dad',mother_id:'mom',record_status:'under_review',gender:'male'},
  {id:'wife',given_name_ar:'أسيل',full_name_ar:'أسيل جميل',record_status:'under_review',gender:'female'},
  {id:'kid',given_name_ar:'وتين',full_name_ar:'وتين يوسف',father_id:'self',mother_id:'wife',record_status:'under_review',gender:'female'}
 ];
 const html=adminView('kinship',{name:'X'},{viewerId:'self',people,marriages:[{partner_a_id:'self',partner_b_id:'wife',status:'reported'}]}, {q:'',status:'',page:1},'f'.repeat(64));
 assert.match(html,/شجرة عائلتي/);
 assert.match(html,/محمد رطيان/);
 assert.match(html,/الأعمام/);
 assert.match(html,/لم تُسجّل أسماء الأخوال/);
 assert.match(html,/وتين يوسف/);
 assert.match(html,/خاص/);
});

test('kinship data can only be read by the system admin',async()=>{
 scope='tribe';
 await assert.rejects(()=>adminData(member,'kinship',new URL(base+'/admin/kinship')),error=>error.status===403);
 scope='system';
 pool.query=async(sql,args)=>{
  if(sql.includes('user_custom_role_assignments a')&&sql.includes('crp.decision'))return {rows:[{decision:'allow',scope_type:'system'}]};
  if(sql.includes('permission_overrides o'))return {rows:[]};
  if(sql.includes('user_profiles'))return {rows:[{person_id:'self'}]};
  return {rows:[]};
 };
 const result=await adminData(member,'kinship',new URL(base+'/admin/kinship'));
 assert.equal(result.data.viewerId,'self');
 assert.deepEqual(result.data.people,[]);
});

test('member grants derive the family leader scope from the verified profile',async()=>{
  const id='22222222-2222-4222-8222-222222222222';
  const family='33333333-3333-4333-8333-333333333333';
  const role='44444444-4444-4444-8444-444444444444';
  const stages=[];
  pool.connect=async()=>({query:async(sql,args)=>{
    stages.push(sql);
    if(sql.startsWith('select id from neon_auth'))return {rows:[{id}]};
    if(sql.includes('for update of p'))return {rows:[{person_id:id,family_unit_id:family,fakhth_unit_id:role}]};
    if(sql.includes("where role_key=$1")){
      assert.deepEqual(args,['diwan_family_leader']);
      return {rows:[{id:role}]};
    }
    if(sql.startsWith('insert into public.user_custom_role_assignments')){
      assert.deepEqual(args,[id,role,'family',family,null,member.id,90]);
    }
    return {rows:[]};
  },release(){}});
  const form=new URLSearchParams({operation:'grant_member_scope',csrf:csrfFor(member,req()),id,scope:'family_leader',duration_days:'90',family:id});
  await adminAction(member,'members',req('/admin/members'),form);
  assert.ok(stages.some(sql=>sql.startsWith('insert into public.user_custom_role_assignments')));
  assert.equal(stages.at(-1),'commit');
});

test('archiving a member revokes non-system assignments in the same transaction',async()=>{
  const id='22222222-2222-4222-8222-222222222222';
  const stages=[];
  pool.connect=async()=>({query:async(sql,args)=>{
    stages.push(sql);
    if(sql.startsWith('select id from neon_auth'))return {rows:[{id}]};
    if(sql.startsWith('insert into public.user_profiles'))assert.deepEqual(args,[id,'archived']);
    if(sql.startsWith('update public.user_custom_role_assignments'))assert.match(sql,/not r\.is_system/);
    return {rows:[]};
  },release(){}});
  const form=new URLSearchParams({operation:'change_member',csrf:csrfFor(member,req()),id,state:'archived',confirm:'yes'});
  await adminAction(member,'members',req('/admin/members'),form);
  assert.ok(stages.some(sql=>sql.startsWith('update public.user_custom_role_assignments')));
  assert.equal(stages.at(-1),'commit');
});
