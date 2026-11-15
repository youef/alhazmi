
import assert from 'node:assert/strict';
import { afterEach,beforeEach,test } from 'node:test';
import { familyAction, familySupervisorData } from './family-management.js';
import { familyAdminView,familyMemberView } from './family-views.js';
import { csrfFor } from './admin.js';
import { pool } from './shared.js';

const userId='11111111-1111-4111-8111-111111111111';
const familyId='22222222-2222-4222-8222-222222222222';
const fakhthId='33333333-3333-4333-8333-333333333333';
const personId='44444444-4444-4444-8444-444444444444';
const requestId='55555555-5555-4555-8555-555555555555';
const user={id:userId,person_id:null,tribe_id:null};
const req=new Request('https://members.example.test/family/manage',{headers:{Cookie:'__Secure-neon-auth.session_token=test',Origin:'https://members.example.test'}});
let originalQuery,originalConnect,grants,connected,queries;
beforeEach(()=>{
 process.env.NEON_AUTH_COOKIE_SECRET='test-secret-at-least-32-characters-long';
 originalQuery=pool.query;
 originalConnect=pool.connect;
 grants=[];
 queries=[];
 pool.query=async(sql,args)=>{
  queries.push({sql,args});
  if(sql.includes('crp.decision'))return {rows:grants};
  if(sql.includes('permission_overrides o'))return {rows:[]};
  if(sql.includes('a.scope_type,a.scope_unit_id,a.scope_person_id'))return {rows:[]};
  if(sql.includes('neon_auth."user" where id=$1'))return {rows:[{email:'verified@example.test',verified:true}]};
  if(sql.includes('lineage_family_fakhth_links where family_unit_id=$1'))return {rows:[{tribe_id:'9425755a-ccfa-568d-4128-a942618420d7',fakhth_unit_id:fakhthId}]};
  return {rows:[]};
 };
 connected=[];
 pool.connect=async()=>({
  query:async(sql,args)=>{
   connected.push({sql,args});
   if(sql.includes('person_identifiers'))return {rows:[]};
   if(sql.includes('insert into public.diwan_family_relation_requests'))return {rows:[{id:requestId}]};
   if(sql.includes('diwan_family_relation_requests')&&sql.includes('identifier_digest'))return {rows:[]};
   if(sql.includes('select * from public.diwan_supervisor_invitations'))return {rows:[]};
   return {rows:[]};
  },
  release(){}
 });
});
afterEach(()=>{
 pool.query=originalQuery;
 pool.connect=originalConnect;
});

test('scoped family submission rejects a user without approved scope',async()=>{
 const form=new URLSearchParams({csrf:csrfFor(user,req),operation:'submit',family:familyId,
  fakhth:fakhthId,relationship:'self',full_name:'اسم تجريبي',gender:'unknown'});
 await assert.rejects(()=>familyAction(user,req,form,'family'),error=>error.status===403);
 assert.equal(connected.at(-1).sql,'rollback');
});

test('unrelated person cannot be linked by supervisor just by guessing a UUID',async()=>{
 grants=[];
 const form=new URLSearchParams({csrf:csrfFor(user,req),operation:'submit',family:familyId,
  fakhth:fakhthId,anchor:personId,relationship:'son',full_name:'اسم آخر',gender:'male'});
 await assert.rejects(()=>familyAction(user,req,form,'family'),error=>error.status===403);
 assert.ok(!connected.some(x=>x.sql.includes('insert into public.diwan_family_relation_requests')));
});

test('CSRF token is mandatory for family forms',async()=>{
 const form=new URLSearchParams({operation:'submit',family:familyId,fakhth:fakhthId});
 await assert.rejects(()=>familyAction(user,req,form,'family'),error=>error.status===403);
 assert.equal(connected.length,0);
});

test('verified email invitation cannot be accepted without matching pending invite',async()=>{
 const form=new URLSearchParams({csrf:csrfFor(user,req),operation:'accept',invite:requestId});
 await assert.rejects(()=>familyAction(user,req,form,'family'),error=>error.status===403);
 assert.equal(connected.at(-1).sql,'rollback');
});

test('admins can propose initial members without storing a raw national ID',async()=>{
 grants=[{decision:'allow',scope_type:'system'}];
 const nationalId='1234567890';
 const form=new URLSearchParams({csrf:csrfFor(user,req),operation:'submit',family:familyId,
  fakhth:fakhthId,relationship:'self',full_name:'اسم تجريبي جديد',gender:'male',
  identifier_type:'national_id',identity_number:nationalId,father_name:'اسم الأب'});
 assert.equal(await familyAction(user,req,form,'family'),'/family/manage?done=1');
 const insert=connected.find(x=>x.sql.includes('insert into public.diwan_family_relation_requests'));
 assert.ok(insert);
 assert.equal(Buffer.isBuffer(insert.args[12]),true);
 assert.equal(insert.args[12].length,32);
 assert.equal(insert.args[13],'7890');
 assert.ok(!connected.some(q=>JSON.stringify(q.args||'').includes(nationalId)));
 assert.ok(connected.some(q=>q.sql.includes('insert into public.notifications')));
 assert.ok(connected.some(q=>q.sql.includes('insert into public.audit_log')));
 assert.equal(connected.at(-1).sql,'commit');
});

test('family rendering escapes names and exposes no sensitive identifier',()=>{
 const fake='<img src=x onerror=alert(1)>';
 const html=familyMemberView({invites:[],families:[],grants:[],pending:[{id:requestId,proposed_name_ar:fake,relationship:'self',family_name:'اختبار',status:'submitted'}],relatives:[],anchors:[],personId:null},'a'.repeat(64),false);
 assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.doesNotMatch(html,/<img src=x onerror=/);
 const admin=familyAdminView({fakhths:[],families:[],parents:[],invitations:[],accounts:[],
  activeSupervisors:[],queue:[{id:requestId,proposed_name_ar:fake,relationship:'self',family_name:'عائلة',fakhth_name:'فخذ',email:'user@example.test',status:'submitted'}]},'b'.repeat(64),false);
 assert.doesNotMatch(admin,/<img src=x onerror=/);
});
