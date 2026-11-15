import {pool,userFrom,authorized,requireOwn,json,fail,route,HttpError,isId} from './shared.js';
const MAX_ROWS=40;
const MODULES={
 profile:{permission:null,query:'select id,full_name_ar,given_name_ar,record_status,visibility,family_unit_id from public.people where id=$1',mode:'person'},
 tree:{permission:'lineage.read',query:'select id,parent_id,unit_type,name_ar from public.lineage_units where tribe_id=$1 order by name_ar limit 500',mode:'tribe'},
 family:{permission:'family.read',query:"select id,full_name_ar,record_status from public.people where family_unit_id=$1 and record_status in ('verified','under_review') order by full_name_ar limit 40",mode:'unit'},
 requests:{permission:null,query:'select id,request_type,status,created_at,reviewed_at from public.change_requests where submitter_id=$1 order by created_at desc limit 40',mode:'user'},
 serviceRequests:{permission:null,query:'select id,service_id,state,created_at from public.member_service_requests where user_id=$1 order by created_at desc limit 40',mode:'user'},
 services:{permission:null,query:"select id,service_key,title_ar,description_ar from public.service_definitions where status='active' and visibility='authenticated' limit 40",mode:'none'},
 documents:{permission:null,query:'select a.id,a.title,a.item_type,a.review_status,a.created_at from public.archive_items a join public.archive_people ap on ap.archive_id=a.id where ap.person_id=$1 order by a.created_at desc limit 40',mode:'person'},
 notifications:{permission:null,query:'select id,title,category,read_at,created_at from public.notifications where user_id=$1 order by created_at desc limit 40',mode:'user'},
 activity:{permission:null,query:'select id,event_code,outcome,created_at from public.user_security_events where user_id=$1 order by created_at desc limit 40',mode:'user'},
 membership:{permission:null,query:'select id,version,card_status,issued_at,expires_at from public.membership_cards where person_id=$1 and revoked_at is null order by issued_at desc limit 5',mode:'person'},
 privacy:{permission:null,query:'select id,purpose,accepted_at,expires_at from public.privacy_consents where subject_person_id=$1 order by accepted_at desc limit 40',mode:'person'},
 claims:{permission:null,query:'select id,person_id,status,created_at from public.person_record_claims where claimant_user_id=$1 order by created_at desc limit 40',mode:'user'},
 familySpaces:{permission:null,query:"select s.id,s.name_ar,s.status from public.family_spaces s join public.family_space_members m on m.space_id=s.id where m.user_id=$1 and m.status='active' and s.status='active' limit 40",mode:'user'},
 workItems:{permission:'tasks.manage',query:"select id,title_ar,priority,state,due_at from public.work_items where family_unit_id=$1 order by created_at desc limit 40",mode:'unit'},
 genealogyReviews:{permission:'quality.review',query:"select id,person_id,quality_state,completeness_score,reviewed_at from public.record_quality_reviews where lineage_unit_id=$1 order by reviewed_at desc limit 40",mode:'unit'},
 suggestions:{permission:'quality.review',query:'select id,suggestion_kind,state,detected_at from public.data_quality_suggestions where tribe_id=$1 order by detected_at desc limit 40',mode:'tribe'},
 familyTimeline:{permission:'family.read',query:"select id,event_kind,occurred_on,description from public.family_timeline where family_unit_id=$1 and review_status='approved' order by occurred_on desc nulls last limit 40",mode:'unit'},
 forms:{permission:'forms.configure',query:'select id,name_ar,version,status from public.form_templates order by created_at desc limit 40',mode:'none'},
 permissions:{permission:'roles.view',query:'select permission_key,module_key,display_name_ar,risk_level from public.permission_catalog where is_active order by module_key limit 200',mode:'none'},
 roles:{permission:'roles.view',query:"select id,name_ar,role_key,role_state,max_scope from public.custom_roles where role_state in ('active','draft') and (tribe_id=$1 or tribe_id is null) order by name_ar limit 40",mode:'tribe'},
 workflows:{permission:'approval.review',query:"select id,name_ar,entity_type,event_type,status from public.approval_workflows where tribe_id=$1 and status='active' limit 40",mode:'tribe'},
 delegations:{permission:null,query:'select id,scope,approved_at,expires_at,revoked_at from public.care_delegations where guardian_user_id=$1 limit 40',mode:'user'},
 audit:{permission:'audit.read',query:'select id,actor_user_id,event_type,outcome,created_at from public.permission_audit_events order by created_at desc limit 40',mode:'none'},
 backups:{permission:'backup.read_status',query:'select id,backup_kind,started_at,completed_at,result from public.backup_runs order by started_at desc limit 40',mode:'none'}
};

// PUBLIC DIRECTORY: only reviewer-approved lineage units are eligible for disclosure.
// A unit marked needs_review is never returned, even if a parent is approved.
const ALLOWED_PUBLIC_ORIGINS = new Set(['https://youef.github.io','http://localhost:3000']);
function publicCors(req) {
 const origin=req.headers.get('origin');
 return origin&&ALLOWED_PUBLIC_ORIGINS.has(origin)
  ? {'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}
  : {};
}
async function publicLineage(req) {
 const url=new URL(req.url);
 const requested=Number(url.searchParams.get('limit')||50);
 const offset=Number(url.searchParams.get('offset')||0);
 if(!Number.isInteger(requested)||requested<1||requested>100||!Number.isSafeInteger(offset)||offset<0||offset>100000)throw new HttpError(400,'Invalid pagination');
 const r=await pool.query(
  `select l.id,l.parent_id,l.unit_type,l.name_ar,l.name_en
    from public.lineage_units l
    where exists (
      select 1 from public.lineage_seed_reviews review
      where review.unit_id=l.id and review.review_status='approved'
      and review.verified_at is not null
    )
    order by l.name_ar,l.id limit $1 offset $2`,
  [requested,offset]
 );
 return Response.json({data:r.rows,meta:{limit:requested,offset,nextOffset:r.rows.length===requested?offset+requested:null,reviewStatus:'approved'}},
 {headers:{...publicCors(req),'Cache-Control':'public,max-age=60','X-Content-Type-Options':'nosniff'}});
}

async function readModule(name,u){
 const def=MODULES[name];if(!def)throw new HttpError(404,'Unknown module');
 const own=await requireOwn(u); // no listing of family info for unlinked accounts
 if(def.permission&&!await authorized(u,def.permission,own))throw new HttpError(403,'Permission denied');
 const param=def.mode==='user'?u.id:def.mode==='person'?own.personId:def.mode==='unit'?own.unitId:def.mode==='tribe'?own.tribeId:undefined;
 if(def.mode==='unit'&&!param)throw new HttpError(403,'Family scope required');
 const result=await pool.query(def.query,param===undefined?[]:[param]);
 return {module:name,items:result.rows};
}
async function submit(req,u){
 const own=await requireOwn(u);
 const body=await req.json().catch(()=>null);
 if(!body||typeof body!=='object')throw new HttpError(400,'Invalid JSON');
 const permitted=['new_person','new_birth','death','marriage','divorce','parentage','correction','archive','biography','privacy'];
 if(!permitted.includes(body.requestType))throw new HttpError(400,'Unsupported request type');
 if(body.personId!==undefined&&body.personId!==own.personId)throw new HttpError(403,'Cannot submit for another person');
 if(typeof body.justification!=='string'||body.justification.length<8||body.justification.length>1000)throw new HttpError(400,'Justification required (8–1000 characters)');
 if(!body.payload||typeof body.payload!=='object'||Array.isArray(body.payload)||JSON.stringify(body.payload).length>8192)throw new HttpError(400,'Invalid payload');
 const r=await pool.query('insert into public.change_requests(tribe_id,request_type,target_person_id,submitter_id,payload,justification) values($1,$2,$3,$4,$5::jsonb,$6) returning id,status,created_at',
 [own.tribeId,body.requestType,own.personId,u.id,JSON.stringify(body.payload),body.justification]);
 return json(r.rows[0],201);
}
export default {async fetch(req){
 try{
  const pathname=route(req);
  if(pathname==='/health')return json({ok:true,service:'alhazmi-api',version:1,auth:'required-on-data'});
  if(pathname==='/v1/public/lineage' && req.method==='OPTIONS')return new Response(null,{status:204,headers:publicCors(req)});
  if(pathname==='/v1/public/lineage' && req.method==='GET')return await publicLineage(req);
  const u=await userFrom(req);
  if(pathname==='/v1/modules'&&req.method==='GET')return json({modules:Object.keys(MODULES),note:'Returned data depends on verified roles, assignments, purpose and person scope'});
  if(pathname==='/v1/me'&&req.method==='GET')return json({id:u.id,linkedPersonId:u.person_id||null,status:u.account_status||'unlinked'});
  if(pathname==='/v1/requests'&&req.method==='POST')return await submit(req,u);
  const m=/^\/v1\/data\/([a-zA-Z]+)$/.exec(pathname);
  if(m&&req.method==='GET')return json(await readModule(m[1],u));
  throw new HttpError(404,'Unknown route');
 }catch(e){if(!(e instanceof HttpError))console.error('api internal failure',e?.code||e?.name);return fail(e);}
}};
