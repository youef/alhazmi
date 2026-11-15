
import { createHmac, timingSafeEqual } from 'node:crypto';
import { pool, authorized, HttpError, isId } from './shared.js';
import { csrfFor } from './admin.js';

const roleKeys=['diwan_fakhth_supervisor','diwan_family_supervisor','diwan_parent_supervisor'];
const relations=['self','spouse','son','daughter','father','mother','grandson','granddaughter','paternal_uncle','paternal_aunt','maternal_uncle','maternal_aunt','paternal_grandfather','paternal_grandmother','maternal_grandfather','maternal_grandmother','guardian'];
const txt=(v,max=200)=>typeof v==='string'?v.trim().slice(0,max):'';
const id=(v)=>{if(typeof v!=='string'||!isId(v))throw new HttpError(400,'Invalid identifier');return v;};
const reject=(message,status=403)=>{throw new HttpError(status,message)};
const csrf=(user,request,form)=>{
 const token=txt(form.get('csrf'),100);
 if(!/^[0-9a-f]{64}$/.test(token) || !timingSafeEqual(Buffer.from(token,'hex'),Buffer.from(csrfFor(user,request),'hex')))reject('Security token mismatch');
};
const adminCheck=async user=>{if(!await authorized(user,'roles.view'))reject('Administrator role required');};
const audit=async(db,user,kind,entity,idValue,after)=>db.query('insert into public.audit_log(actor_user_id,operation,entity_table,entity_id,after_data) values($1,$2,$3,$4,$5::jsonb)',[user.id,kind,entity,idValue,JSON.stringify(after)]);
const grantRows=async user=>(await pool.query(
 "select a.scope_type,a.scope_unit_id,a.scope_person_id,r.role_key from public.user_custom_role_assignments a join public.custom_roles r on r.id=a.role_id where a.user_id=$1 and r.role_key=any($2::text[]) and r.role_state='active' and a.approved_at is not null and a.revoked_at is null and a.starts_at<=now() and (a.expires_at is null or a.expires_at>now())",
 [user.id,roleKeys])).rows;
const verifiedEmail=async user=>{
 const result=await pool.query('select email,"emailVerified" verified from neon_auth."user" where id=$1 and banned is distinct from true',[user.id]);
 if(!result.rows[0]?.verified)reject('A verified email is required');
 return String(result.rows[0].email||'').toLowerCase();
};
async function chooseScope(user,roleList,familyId,anchorId,fakhthId,isAdmin){
 const found=await pool.query('select family_unit_id,tribe_id,fakhth_unit_id from public.lineage_family_fakhth_links where family_unit_id=$1',[familyId]);
 const family=found.rows[0];
 if(!family||family.fakhth_unit_id!==fakhthId)reject('Family must be selected from the existing fakhth',400);
 if(isAdmin)return family;
 if(roleList.some(g=>g.role_key==='diwan_fakhth_supervisor'&&g.scope_type==='unit'&&g.scope_unit_id===fakhthId))return family;
 if(roleList.some(g=>g.role_key==='diwan_family_supervisor'&&g.scope_type==='family'&&g.scope_unit_id===familyId))return family;
 const parent=roleList.find(g=>g.role_key==='diwan_parent_supervisor'&&g.scope_type==='self'&&g.scope_person_id===user.person_id);
 if(parent){
  const own=await pool.query('select 1 from public.people where id=$1 and family_unit_id=$2 and record_status=$3',[user.person_id,familyId,'verified']);
  if(!own.rows.length)reject('Parent supervisor must be linked to an approved family');
  if(!anchorId)reject('Choose a verified family anchor');
  if(anchorId!==user.person_id){
   const d=await pool.query("select 1 from public.diwan_family_kinship($1) where related_person_id=$2 and relation_kind in ('child','grandchild_or_descendant') limit 1",[user.person_id,anchorId]);
   if(!d.rows.length)reject('The selected person is outside your verified descendants');
  }
  return family;
 }
 reject('Your supervisor role does not permit this family');
}
async function inviteData(user){
 await adminCheck(user);
 const [fakhths,families,parents,invitations,accounts,queue]=await Promise.all([
  pool.query('select f.unit_id id,l.name_ar name,root.name_ar root from public.lineage_fakhths f join public.lineage_units l on l.id=f.unit_id join public.lineage_units root on root.id=f.major_branch_id order by root.name_ar,l.name_ar'),
  pool.query('select f.family_unit_id id,f.fakhth_unit_id fakhth_id,l.name_ar name from public.lineage_family_fakhth_links f join public.lineage_units l on l.id=f.family_unit_id order by l.name_ar limit 500'),
  pool.query("select p.id,p.full_name_ar name,p.family_unit_id family_id,f.fakhth_unit_id fakhth_id from public.people p join public.lineage_family_fakhth_links f on f.family_unit_id=p.family_unit_id where p.record_status='verified' order by p.full_name_ar limit 120"),
  pool.query('select id,invited_email,invited_name,role_key,fakhth_unit_id,family_unit_id,parent_person_id,created_at,accepted_at,expires_at,revoked_at from public.diwan_supervisor_invitations order by created_at desc limit 70'),
  pool.query('select id,email,name from neon_auth."user" where "emailVerified" is true order by "createdAt" desc limit 100'),
  pool.query("select q.id,q.proposed_name_ar,q.relationship,q.status,q.created_at,q.proposed_notes,u.email,l.name_ar family_name,p.name_ar fakhth_name from public.diwan_family_relation_requests q join neon_auth.\"user\" u on u.id=q.submitter_id join public.lineage_units l on l.id=q.family_unit_id join public.lineage_units p on p.id=q.fakhth_unit_id order by q.created_at desc limit 70")
 ]);
 return {fakhths:fakhths.rows,families:families.rows,parents:parents.rows,invitations:invitations.rows,accounts:accounts.rows,queue:queue.rows};
}
async function familyData(user){
 const admin=await authorized(user,'roles.view');
 const email=await verifiedEmail(user);
 const grants=await grantRows(user);
 const invites=(await pool.query("select id,role_key,invited_email,created_at,expires_at from public.diwan_supervisor_invitations where invited_email=$1 and accepted_at is null and revoked_at is null and expires_at>now() order by created_at desc",[email])).rows;
 const selected=(await pool.query(
 "select f.family_unit_id id,l.name_ar name,f.fakhth_unit_id fakhth_id,k.name_ar fakhth_name from public.lineage_family_fakhth_links f join public.lineage_units l on l.id=f.family_unit_id join public.lineage_units k on k.id=f.fakhth_unit_id where f.tribe_id=$1 order by k.name_ar,l.name_ar limit 450",
 ['9425755a-ccfa-568d-4128-a942618420d7'])).rows;
 const families=admin?selected:selected.filter(f=>grants.some(g=>
  g.role_key==='diwan_fakhth_supervisor'&&g.scope_unit_id===f.fakhth_id&&g.scope_type==='unit'
  ||g.role_key==='diwan_family_supervisor'&&g.scope_unit_id===f.id&&g.scope_type==='family'));
 if(user.person_id&&grants.some(g=>g.role_key==='diwan_parent_supervisor'&&g.scope_person_id===user.person_id)){
  const own=(await pool.query("select family_unit_id from public.people where id=$1 and record_status='verified'",[user.person_id])).rows[0];
  const f=selected.find(v=>v.id===own?.family_unit_id);
  if(f&&!families.some(x=>x.id===f.id))families.push(f);
 }

 const safeIds=families.map(v=>v.id);
 let anchors=[];
 if(safeIds.length){
  const a=await pool.query(
   "select p.id,p.full_name_ar name,p.family_unit_id from public.people p left join public.diwan_person_visibility_consents c on c.person_id=p.id and c.allowed_user_id=$2 and c.revoked_at is null where p.family_unit_id=any($1::uuid[]) and p.record_status='verified' and ($3::boolean or p.id=$4::uuid or p.visibility <> 'private' or coalesce(c.show_name,false)) order by p.full_name_ar limit 100",
   [safeIds,user.id,admin,user.person_id||null]);
  anchors=a.rows;
 }
 if(user.person_id&&!anchors.some(p=>p.id===user.person_id)){
  const own=await pool.query("select id,full_name_ar name,family_unit_id from public.people where id=$1 and record_status='verified'",[user.person_id]);
  if(own.rows.length)anchors.push(own.rows[0]);
 }

 const pending=(await pool.query("select q.id,q.proposed_name_ar,q.relationship,q.status,q.created_at,f.name_ar family_name from public.diwan_family_relation_requests q join public.lineage_units f on f.id=q.family_unit_id where q.submitter_id=$1 order by q.created_at desc limit 70",[user.id])).rows;
 let relatives=[];
 if(user.person_id){
  // Return identifiers only for relatives whose name sharing is permitted.
  relatives=(await pool.query(
   "select k.relation_kind,k.generation,case when p.id=$2 or p.visibility <> 'private' or coalesce(consent.show_name,false) then p.full_name_ar else null end display_name from public.diwan_family_kinship($2) k join public.people p on p.id=k.related_person_id left join public.diwan_person_visibility_consents consent on consent.person_id=p.id and consent.allowed_user_id=$1 and consent.revoked_at is null order by k.generation,k.relation_kind limit 250",
  [user.id,user.person_id])).rows;
 }
 return {admin,grants,invites,families,pending,relatives,anchors,personId:user.person_id};
}
function fingerprint(value,kind){
 const secret=process.env.DIWAN_ID_HMAC_KEY||process.env.NEON_AUTH_COOKIE_SECRET;
 if(!secret)reject('Secure identity matching is not configured',503);
 const normalized=txt(value,50).replace(/[\s-]/g,'').toUpperCase();
 if(kind==='national_id'||kind==='residency'){
  if(!/^[12][0-9]{9}$/.test(normalized))reject('A valid ten-digit Saudi identity or residency number is required',400);
 }else if(!/^[A-Z0-9]{6,16}$/.test(normalized))reject('Identifier format not accepted',400);
 // A domain-separated HMAC prevents storing or searching a raw national number.
 const key=createHmac('sha256',secret).update('diwan:identity-index:v1').digest();
 return {digest:createHmac('sha256',key).update('SA|'+kind+'|'+normalized).digest(),last4:normalized.slice(-4)};
}
async function createInvitation(db,user,form){
 const email=txt(form.get('email'),254).toLowerCase(),name=txt(form.get('name'),100);
 const role=txt(form.get('role'),70),fakhth=id(txt(form.get('fakhth'),50));
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!roleKeys.includes(role))reject('Invalid verified user invitation',400);
 const family=role==='diwan_fakhth_supervisor'?null:id(txt(form.get('family'),50));
 const parent=role==='diwan_parent_supervisor'?id(txt(form.get('parent'),50)):null;
 const inserted=await db.query("insert into public.diwan_supervisor_invitations(invited_email,invited_name,role_key,fakhth_unit_id,family_unit_id,parent_person_id,invited_by) values($1,$2,$3,$4,$5,$6,$7) returning id",[email,name||null,role,fakhth,family,parent,user.id]);
 // Notify existing verified accounts inside the member portal; new accounts register themselves.
 const known=await db.query('select id from neon_auth."user" where lower(email)=$1 and "emailVerified" is true',[email]);
 if(known.rows.length){
  await db.query('select auth.link_verified_neon_user($1::uuid)',[known.rows[0].id]);
  await db.query("insert into public.notifications(user_id,category,title,body,related_record_id) values($1,'membership','دعوة إشراف جديدة','توجد دعوة إشراف معتمدة بانتظار قبولك من بوابة الديوان.',$2)",[known.rows[0].id,inserted.rows[0].id]);
 }
 await audit(db,user,'diwan_supervisor_invited','diwan_supervisor_invitations',inserted.rows[0].id,{role,fakhth,family,parent});
}
async function acceptInvitation(db,user,form){
 const invite=id(txt(form.get('invite'),50));
 const email=await verifiedEmail(user);
 const r=await db.query("select * from public.diwan_supervisor_invitations where id=$1 and invited_email=$2 and revoked_at is null and accepted_at is null and expires_at>now() for update",[invite,email]);
 const item=r.rows[0];if(!item)reject('Invitation expired or belongs to a different verified email',403);
 const actor=await db.query('select id from neon_auth."user" where id=$1 and "emailVerified" is true',[user.id]);
 if(!actor.rows.length)reject('Email verification required');
 const role=(await db.query("select id from public.custom_roles where role_key=$1 and role_state='active'",[item.role_key])).rows[0];
 if(!role)reject('Role is not enabled',409);
 const kind=item.role_key==='diwan_fakhth_supervisor'?'unit':item.role_key==='diwan_family_supervisor'?'family':'self';
 if(kind==='self'){
  if(user.person_id!==item.parent_person_id)reject('Parent supervisor must first verify and link their own person record');
  const p=await db.query("select 1 from public.people where id=$1 and record_status='verified' and family_unit_id=$2",[user.person_id,item.family_unit_id]);
  if(!p.rows.length)reject('Parent record verification required');
 }
 await db.query('select auth.link_verified_neon_user($1::uuid)',[user.id]);
 const unitId=kind==='unit'?item.fakhth_unit_id:kind==='family'?item.family_unit_id:null;
 const previously=await db.query("select 1 from public.user_custom_role_assignments where user_id=$1 and role_id=$2 and scope_type=$3 and scope_unit_id is not distinct from $4::uuid and scope_person_id is not distinct from $5::uuid and revoked_at is null and (expires_at is null or expires_at>now())",[user.id,role.id,kind,unitId,kind==='self'?user.person_id:null]);
 if(!previously.rows.length)await db.query("insert into public.user_custom_role_assignments(user_id,role_id,scope_type,scope_unit_id,scope_person_id,assigned_by,approved_by,approved_at,expires_at,reason) values($1,$2,$3,$4,$5,$6,$6,now(),now()+interval '1 year','Verified email invitation to scoped supervision')",[user.id,role.id,kind,unitId,kind==='self'?user.person_id:null,item.invited_by]);
 await db.query('update public.diwan_supervisor_invitations set accepted_by=$1,accepted_at=now() where id=$2',[user.id,invite]);
 await audit(db,user,'diwan_supervisor_invitation_accepted','diwan_supervisor_invitations',invite,{role:item.role_key,scope:kind});
}
async function requestFamilyPerson(db,user,form){
 const familyId=id(txt(form.get('family'),50)), fakhthId=id(txt(form.get('fakhth'),50));
 const relation=txt(form.get('relationship'),60);
 const anchor=txt(form.get('anchor'),50)||null;
 if(!relations.includes(relation))reject('Unsupported family connection',400);
 if(anchor)id(anchor);
 const admin=await authorized(user,'roles.view'),roles=await grantRows(user);
 const scope=await chooseScope(user,roles,familyId,anchor,fakhthId,admin);
 const name=txt(form.get('full_name'),200);
 if(name.length<3)reject('Full name is required',400);
 const gender=txt(form.get('gender'),20)||'unknown';
 if(!['male','female','unknown','undisclosed'].includes(gender))reject('Invalid gender',400);
 if((relation==='son'||relation==='grandson')&&gender!=='male'||(relation==='daughter'||relation==='granddaughter')&&gender!=='female')reject('Relative type and gender do not match',400);
 const dob=txt(form.get('birth_date'),12)||null;
 if(dob&&!/^\d{4}-\d{2}-\d{2}$/.test(dob))reject('Date must be YYYY-MM-DD',400);
 const notes=txt(form.get('notes'),1000);
 const kind=txt(form.get('identifier_type'),50);
 const identity=txt(form.get('identity_number'),60);
 if(Boolean(kind)!==Boolean(identity))reject('Identifier type and number must both be supplied',400);
 if(kind&&!['national_id','residency','passport','birth_certificate'].includes(kind))reject('Unsupported identity document',400);
 const hashed=identity?fingerprint(identity,kind):null;
 let existing=null;
 if(hashed){
  const match=await db.query("select person_id from public.person_identifiers where identifier_hmac=$1 and status <> 'revoked' limit 1",[hashed.digest]);
  existing=match.rows[0]?.person_id||null;
  const prior=await db.query("select 1 from public.diwan_family_relation_requests where identifier_digest=$1 and submitter_id=$2 and status in ('submitted','under_review','needs_evidence') limit 1",[hashed.digest,user.id]);
  if(prior.rows.length)reject('A request for this identifier is already under review',409);
 }
 const result=await db.query("insert into public.diwan_family_relation_requests(tribe_id,family_unit_id,fakhth_unit_id,submitter_id,anchor_person_id,linked_person_id,relationship,proposed_name_ar,proposed_gender,proposed_birth_date,proposed_birth_precision,identifier_type,identifier_digest,identifier_last4,proposed_notes) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning id",
  [scope.tribe_id,familyId,fakhthId,user.id,anchor,existing,relation,name,gender,dob,dob?'day':'unknown',kind||null,hashed?.digest||null,hashed?.last4||null,notes||null]);
 const recordId=result.rows[0].id;
 await db.query("insert into public.notifications(user_id,category,title,body,related_record_id) select distinct a.user_id,'lineage','طلب مراجعة عائلية جديد','وصل اقتراح إضافة شخص أو ربط قرابة؛ يتطلب مراجعة الإدارة.',$1 from public.user_custom_role_assignments a join public.custom_roles r on r.id=a.role_id where r.role_key='diwan_super_admin' and r.role_state='active' and a.scope_type='system' and a.revoked_at is null and a.approved_at is not null",[recordId]);
 await audit(db,user,'diwan_family_relation_submitted','diwan_family_relation_requests',recordId,{relation,fakhthId,familyId,containsIdentifier:!!hashed});
}
async function reviewFamilyPerson(db,user,form){
 const reqId=id(txt(form.get('request'),50)),next=txt(form.get('decision'),30);
 const note=txt(form.get('note'),700),expected=txt(form.get('expected'),30);
 if(!['under_review','needs_evidence','rejected','approved'].includes(next)||note.length<10)reject('Review requires a reason of at least 10 characters',400);
 if(!['submitted','under_review','needs_evidence'].includes(expected))reject('Invalid source review state',409);
 const result=await db.query('select * from public.diwan_family_relation_requests where id=$1 and status=$2 for update',[reqId,expected]);
 const p=result.rows[0];if(!p)reject('This request has already changed',409);
 let personId=p.linked_person_id||null;
 if(next==='approved'){
  if(form.get('confirm_evidence')!=='yes')reject('You must verify the evidence independently before accepting the provisional entry');
  if(!personId){
   const name=String(p.proposed_name_ar);
   const first=name.split(/\s+/)[0];
   // A draft record is deliberately not a verified person or publicly visible genealogy.
   const familyId=p.relationship==='spouse'?null:p.family_unit_id;
   const created=await db.query("insert into public.people(tribe_id,family_unit_id,given_name_ar,full_name_ar,gender,birth_date,birth_date_precision,record_status,visibility,created_by) values($1,$2,$3,$4,$5,$6,$7,'under_review','private',$8) returning id",
    [p.tribe_id,familyId,first,name,p.proposed_gender,p.proposed_birth_date,p.proposed_birth_precision,user.id]);
   personId=created.rows[0].id;
   if(p.identifier_digest)await db.query("insert into public.person_identifiers(person_id,country_code,issuer,identifier_type,identifier_hmac,hmac_key_version,masked_value,status) values($1,'SA','self-reported',$2,$3,1,$4,'pending')",[personId,p.identifier_type,p.identifier_digest,'******'+p.identifier_last4]);
  }
  if(p.anchor_person_id){
   if(['son','daughter','father','mother'].includes(p.relationship)){
    let child=personId,parent=p.anchor_person_id,role=null;
    if(['father','mother'].includes(p.relationship)){child=p.anchor_person_id;parent=personId;role=p.relationship;}
    else{
     const gender=(await db.query('select gender from public.people where id=$1',[p.anchor_person_id])).rows[0]?.gender;
     role=gender==='male'?'father':gender==='female'?'mother':null;
    }
    if(role)await db.query("insert into public.parentage_assertions(child_id,parent_id,parent_role,basis,confidence,status) values($1,$2,$3,'reported','unverified','pending')",[child,parent,role]);
   }else if(p.relationship==='spouse'){
    await db.query("insert into public.marriages(partner_a_id,partner_b_id,status,notes) values($1,$2,'reported','Unverified relationship pending independent documentation')",[p.anchor_person_id,personId]);
   }
  }
 }
 await db.query("update public.diwan_family_relation_requests set status=$1,reviewed_by=$2,reviewed_at=now(),reviewed_notes=$3,created_person_id=$4,updated_at=now() where id=$5",[next,user.id,note,next==='approved'?personId:null,reqId]);
 await db.query("insert into public.notifications(user_id,category,title,body,related_record_id) values($1,'lineage','تحديث طلب الربط العائلي','تم تحديث حالة طلبك؛ راجع بوابة الديوان.',$2)",[p.submitter_id,reqId]);
 await audit(db,user,'diwan_family_relation_reviewed','diwan_family_relation_requests',reqId,{decision:next,createdDraft:next==='approved'&&!!personId});
}
const operators={
 invite:['admin',createInvitation,'roles.assign'],
 review:['admin',reviewFamilyPerson,'identity.edit'],
 accept:['family',acceptInvitation,null],
 submit:['family',requestFamilyPerson,null],
};
export async function familyAction(user,request,form,area){
 csrf(user,request,form);
 if(area==='admin')await adminCheck(user);
 const operation=txt(form.get('operation'),30),step=operators[operation];
 if(!step||step[0]!==area)reject('Unknown operation',404);
 if(step[2]&&!await authorized(user,step[2]))reject('Permission to manage this action required');
 const db=await pool.connect();
 try{
  await db.query('begin');
  await step[1](db,user,form);
  await db.query('commit');
 }catch(error){
  await db.query('rollback');
  throw error;
 }finally{db.release();}
 return area==='admin'?'/admin/supervisors?done=1':'/family/manage?done=1';
}
export const familyAdminData=inviteData;
export const familySupervisorData=familyData;
