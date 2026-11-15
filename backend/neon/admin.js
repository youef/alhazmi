
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { authorized, HttpError, isId, pool } from './shared.js';

export const ADMIN_SECTIONS=['overview','members','requests','services','claims','roles','audit','system'];
const n=18;
const clip=(v,max=100)=>typeof v==='string'?v.trim().slice(0,max):'';
const guard=async(u,p='roles.view')=>{if(!await authorized(u,p))throw new HttpError(403,'Access denied');};
const number=x=>Number(x||0);
export const csrfFor=(u,req)=>{
 const secret=process.env.NEON_AUTH_COOKIE_SECRET;
 const cookies=req.headers.get('cookie');
 if(!secret||!cookies)throw new HttpError(403,'Session required');
 return createHmac('sha256',secret).update('diwan-admin:'+u.id+':'+createHash('sha256').update(cookies).digest('hex')).digest('hex');
};
const verify=(u,req,token)=>{
 if(typeof token!=='string'||!/^[0-9a-f]{64}$/.test(token)||!timingSafeEqual(Buffer.from(csrfFor(u,req),'hex'),Buffer.from(token,'hex')))throw new HttpError(403,'Invalid security token');
};
const uid=(form,key)=>{const v=clip(form.get(key),50);if(!isId(v))throw new HttpError(400,'Invalid identifier');return v;};
const metric=async sql=>number((await pool.query(sql)).rows[0]?.total);
const list=async(base,countSql,args,page)=>{
 const [rows,total]=await Promise.all([pool.query(base+' limit $'+(args.length+1)+' offset $'+(args.length+2),[...args,n,(page-1)*n]),pool.query(countSql,args)]);
 return {rows:rows.rows,total:number(total.rows[0]?.total),page,limit:n};
};
export async function adminData(u,section,url){
 if(!ADMIN_SECTIONS.includes(section))throw new HttpError(404,'Unknown section');
 await guard(u);
 const q=clip(url.searchParams.get('q'),80),status=clip(url.searchParams.get('status'),30);
 const rawPage=Number(url.searchParams.get('page')||1),page=Number.isSafeInteger(rawPage)&&rawPage>0?Math.min(rawPage,1000):1;
 const filter={q,status,page};
 if(section==='overview'){
  const metrics=await Promise.all([
   metric('select count(*) total from neon_auth."user" where banned is distinct from true'),
   metric('select count(*) total from public.people'),
   metric("select count(*) total from public.change_requests where status in ('submitted','triage','needs_evidence')"),
   metric("select count(*) total from public.member_service_requests where state in ('submitted','in_review','needs_evidence')"),
   metric("select count(*) total from public.person_record_claims where status in ('submitted','review','needs_evidence')"),
   metric("select count(*) total from public.service_definitions where status='active'"),
   metric('select count(*) total from public.user_custom_role_assignments where approved_at is not null and revoked_at is null and (expires_at is null or expires_at>now())'),
  ]);
  const [recent,events]=await Promise.all([
   pool.query('select r.id,r.request_type,r.status,r.created_at,u.email from public.change_requests r left join neon_auth."user" u on u.id=r.submitter_id order by r.created_at desc limit 7'),
   pool.query('select a.id,a.event_type,a.outcome,a.created_at,u.email from public.permission_audit_events a left join neon_auth."user" u on u.id=a.actor_user_id order by a.id desc limit 7'),
  ]);
  return {filter,data:{metrics,recent:recent.rows,events:events.rows}};
 }
 if(section==='members'){
  const where=" where ($1='' or position(lower($1) in lower(coalesce(u.email,'')||' '||coalesce(u.name,'')))>0)";
  return {filter,data:await list(`select u.id,u.name,u.email,u."emailVerified" verified,u."createdAt" created_at,coalesce(p.account_status,'pending') account_status,
   exists(select 1 from public.user_custom_role_assignments a join public.custom_roles r on r.id=a.role_id where a.user_id=u.id and r.is_system and a.scope_type='system' and a.revoked_at is null and a.approved_at is not null) is_admin
   from neon_auth."user" u left join public.user_profiles p on p.user_id=u.id`+where+' order by u."createdAt" desc,u.id desc','select count(*) total from neon_auth."user" u'+where,[q],page)};
 }
 if(section==='requests'){
  await guard(u,'approval.review');
  const from=' from public.change_requests r left join neon_auth."user" u on u.id=r.submitter_id';
  const where=" where ($1='' or position(lower($1) in lower(coalesce(u.email,'')||' '||r.request_type))>0) and ($2='' or r.status=$2)";
  return {filter,data:await list('select r.id,r.request_type,r.status,r.justification,r.review_notes,r.created_at,u.email'+from+where+' order by r.created_at desc,r.id desc','select count(*) total'+from+where,[q,status],page)};
 }
 if(section==='services'){
  await guard(u,'approval.configure');
  const from=' from public.service_definitions s';
  const where=" where ($1='' or position(lower($1) in lower(s.service_key||' '||s.title_ar))>0) and ($2='' or s.status=$2)";
  const data=await list('select s.id,s.title_ar,s.service_key,s.status,s.visibility,s.description_ar,s.created_at'+from+where+' order by s.created_at desc,s.id desc','select count(*) total'+from+where,[q,status],page);
  data.backlog=(await pool.query('select r.id,r.state,r.created_at,s.title_ar,u.email from public.member_service_requests r left join public.service_definitions s on s.id=r.service_id left join neon_auth."user" u on u.id=r.user_id order by r.created_at desc limit 12')).rows;
  return {filter,data};
 }
 if(section==='claims'){
  await guard(u,'identity.read');
  const from=' from public.person_record_claims c left join neon_auth."user" u on u.id=c.claimant_user_id left join public.people p on p.id=c.person_id';
  const where=" where ($1='' or position(lower($1) in lower(coalesce(u.email,'')||' '||coalesce(p.full_name_ar,'')))>0) and ($2='' or c.status=$2)";
  return {filter,data:await list('select c.id,c.status,c.created_at,c.reviewed_at,u.email,p.full_name_ar'+from+where+' order by c.created_at desc,c.id desc','select count(*) total'+from+where,[q,status],page)};
 }
 if(section==='roles'){
  const [roles,assignments,permissions,tribes,users]=await Promise.all([
   pool.query("select r.id,r.name_ar,r.role_key,r.role_state,r.max_scope,r.is_system,(select count(*) from public.custom_role_permissions p where p.role_id=r.id and p.decision='allow') permission_count from public.custom_roles r order by r.is_system desc,r.name_ar limit 100"),
   pool.query('select a.id,a.user_id,a.scope_type,a.scope_tribe_id,a.approved_at,a.expires_at,u.email,r.name_ar,r.is_system from public.user_custom_role_assignments a join public.custom_roles r on r.id=a.role_id join neon_auth."user" u on u.id=a.user_id where a.revoked_at is null order by a.created_at desc limit 100'),
   pool.query("select id,permission_key,display_name_ar,risk_level from public.permission_catalog where is_active and is_assignable and risk_level in ('normal','sensitive') and permission_key not like 'roles.%' and permission_key not like 'sessions.%' order by module_key,permission_key"),
   pool.query('select id,name_ar from public.tribes order by name_ar limit 100'),
   pool.query('select id,name,email from neon_auth."user" where "emailVerified" is true and banned is distinct from true order by "createdAt" desc limit 150'),
  ]);
  return {filter,data:{roles:roles.rows,assignments:assignments.rows,permissions:permissions.rows,tribes:tribes.rows,users:users.rows}};
 }
 if(section==='audit'){
  await guard(u,'audit.read');
  const from=' from public.permission_audit_events a left join neon_auth."user" u on u.id=a.actor_user_id';
  const where=" where ($1='' or position(lower($1) in lower(a.event_type||' '||coalesce(u.email,'')))>0)";
  return {filter,data:await list('select a.id,a.event_type,a.outcome,a.metadata,a.created_at,u.email'+from+where+' order by a.id desc','select count(*) total'+from+where,[q],page)};
 }
 await guard(u,'backup.read_status');
 const [version,perms,backups]=await Promise.all([
  pool.query("select now() as checked_at,current_setting('server_version') as db_version"),
  pool.query('select count(*) total,count(*) filter(where is_active) active from public.permission_catalog'),
  pool.query('select backup_kind,started_at,completed_at,result from public.backup_runs order by started_at desc limit 15'),
 ]);
 return {filter,data:{server:version.rows[0],permissions:perms.rows[0],backups:backups.rows}};
}
const auditWrite=(db,u,kind,meta,target=null)=>db.query("insert into public.permission_audit_events(actor_user_id,event_type,target_user_id,outcome,metadata) values($1,$2,$3,'success',$4::jsonb)",[u.id,kind,target,JSON.stringify(meta)]);
async function reviewRequest(db,u,f){
 const id=uid(f,'id'),expected=clip(f.get('expected'),30),next=clip(f.get('next'),30),note=clip(f.get('note'),600);
 if(!['submitted','triage','needs_evidence'].includes(expected)||!['triage','needs_evidence','approved','rejected'].includes(next)||note.length<10)throw new HttpError(400,'Review requires a valid status and a note of 10+ characters');
 const r=await db.query('update public.change_requests set status=$1,reviewed_by=$2,reviewed_at=now(),review_notes=$3,updated_at=now() where id=$4 and status=$5 returning id',[next,u.id,note,id,expected]);
 if(!r.rows.length)throw new HttpError(409,'Request was changed by another reviewer');
 await auditWrite(db,u,'admin_change_request_reviewed',{id,previous:expected,next});
}
async function reviewClaim(db,u,f){
 const id=uid(f,'id'),expected=clip(f.get('expected'),30),next=clip(f.get('next'),30);
 if(!['submitted','review','needs_evidence'].includes(expected)||!['review','needs_evidence','rejected'].includes(next))throw new HttpError(400,'Unsupported claim state');
 const r=await db.query('update public.person_record_claims set status=$1,reviewed_by=$2,reviewed_at=now() where id=$3 and status=$4 returning id',[next,u.id,id,expected]);
 if(!r.rows.length)throw new HttpError(409,'Claim has changed');
 await auditWrite(db,u,'admin_claim_reviewed',{id,previous:expected,next});
}
async function changeService(db,u,f){
 const id=uid(f,'id'),expected=clip(f.get('expected'),30),next=clip(f.get('next'),30);
 if(!['draft','active'].includes(expected)||!['draft','active'].includes(next)||next===expected)throw new HttpError(400,'Unsupported service state');
 const r=await db.query('update public.service_definitions set status=$1 where id=$2 and status=$3 returning id',[next,id,expected]);
 if(!r.rows.length)throw new HttpError(409,'Service has changed');
 await auditWrite(db,u,'admin_service_status_changed',{id,previous:expected,next});
}
async function changeMember(db,u,f){
 const id=uid(f,'id'),state=clip(f.get('state'),20);
 if(!['suspended','active'].includes(state)||id===u.id)throw new HttpError(403,'Cannot change this account');
 const exists=await db.query('select id from neon_auth."user" where id=$1 and "emailVerified" is true and banned is distinct from true',[id]);
 if(!exists.rows.length)throw new HttpError(404,'Verified member not found');
 const protectedUser=await db.query("select 1 from public.user_custom_role_assignments a join public.custom_roles r on r.id=a.role_id where a.user_id=$1 and r.is_system and a.scope_type='system' and a.revoked_at is null and a.approved_at is not null limit 1",[id]);
 if(protectedUser.rows.length)throw new HttpError(403,'System administrators cannot be suspended here');
 await db.query('select auth.link_verified_neon_user($1::uuid)',[id]);
 await db.query('insert into public.user_profiles(user_id,account_status) values($1,$2) on conflict(user_id) do update set account_status=excluded.account_status',[id,state]);
 await auditWrite(db,u,'admin_member_status_changed',{newState:state},id);
}
async function createRole(db,u,f){
 const key=clip(f.get('key'),64),name=clip(f.get('name'),100);
 const chosen=f.getAll('permission').map(x=>String(x));
 const ids=[...new Set(chosen)];
 if(!/^[a-z][a-z0-9_-]{1,63}$/.test(key)||name.length<3||!ids.length||ids.length>30||chosen.length!==ids.length||ids.some(x=>!isId(x)))throw new HttpError(400,'Role fields or permissions are invalid');
 const permitted=await db.query("select id from public.permission_catalog where id=any($1::uuid[]) and is_active and is_assignable and risk_level in ('normal','sensitive') and permission_key not like 'roles.%' and permission_key not like 'sessions.%'",[ids]);
 if(permitted.rows.length!==ids.length)throw new HttpError(403,'Restricted permission');
 const r=await db.query("insert into public.custom_roles(role_key,name_ar,is_system,role_state,max_scope,created_by) values($1,$2,false,'active','tribe',$3) returning id",[key,name,u.id]);
 await db.query("insert into public.custom_role_permissions(role_id,permission_id,decision,created_by) select $1,id,'allow',$2 from public.permission_catalog where id=any($3::uuid[])",[r.rows[0].id,u.id,ids]);
 await auditWrite(db,u,'admin_role_created',{key,permissionCount:ids.length});
}
async function grantRole(db,u,f){
 const role=uid(f,'role'),target=uid(f,'target'),tribe=uid(f,'tribe');
 const roles=await db.query("select id from public.custom_roles where id=$1 and not is_system and role_state='active' and max_scope='tribe' and tribe_id is null",[role]);
 const people=await db.query('select id from neon_auth."user" where id=$1 and "emailVerified" is true and banned is distinct from true',[target]);
 const scopes=await db.query('select id from public.tribes where id=$1',[tribe]);
 if(!roles.rows.length||!people.rows.length||!scopes.rows.length)throw new HttpError(403,'Invalid role, account or tribe');
 await db.query('select auth.link_verified_neon_user($1::uuid)',[target]);
 const exists=await db.query('select 1 from public.user_custom_role_assignments where user_id=$1 and role_id=$2 and scope_tribe_id=$3 and revoked_at is null and (expires_at is null or expires_at>now())',[target,role,tribe]);
 if(exists.rows.length)throw new HttpError(409,'Assignment exists');
 await db.query("insert into public.user_custom_role_assignments(user_id,role_id,scope_type,scope_tribe_id,assigned_by,approved_by,approved_at,reason) values($1,$2,'tribe',$3,$4,$4,now(),'Approved in Diwan administration')",[target,role,tribe,u.id]);
 await auditWrite(db,u,'admin_role_granted',{role,tribe},target);
}
async function revokeRole(db,u,f){
 const id=uid(f,'id');
 const r=await db.query('update public.user_custom_role_assignments a set revoked_at=now() from public.custom_roles r where a.id=$1 and a.role_id=r.id and not r.is_system and a.revoked_at is null returning a.user_id',[id]);
 if(!r.rows.length)throw new HttpError(409,'Protected or revoked role');
 await auditWrite(db,u,'admin_role_revoked',{assignmentId:id},r.rows[0].user_id);
}
const OPERATIONS={
 review_request:['requests','approval.review',reviewRequest],
 review_claim:['claims','identity.edit',reviewClaim],
 change_service:['services','approval.configure',changeService],
 change_member:['members','roles.manage',changeMember],
 create_role:['roles','roles.manage',createRole],
 grant_role:['roles','roles.assign',grantRole],
 revoke_role:['roles','roles.assign',revokeRole],
};
export async function adminAction(u,section,req,form){
 await guard(u);
 verify(u,req,form.get('csrf'));
 const op=clip(form.get('operation'),40),rule=OPERATIONS[op];
 if(!rule||rule[0]!==section)throw new HttpError(404,'Unknown action');
 await guard(u,rule[1]);
 const db=await pool.connect();
 try{
  await db.query('begin');
  await rule[2](db,u,form);
  await db.query('commit');
 }catch(err){
  await db.query('rollback');
  throw err;
 }finally{db.release();}
 return '/admin/'+section+'?done=1';
}
