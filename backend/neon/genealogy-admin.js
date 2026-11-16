import { timingSafeEqual } from 'node:crypto';
import { authorized, HttpError, isId, pool } from './shared.js';
import { csrfFor } from './admin.js';
import { cleanName, canonicalName, fingerprintIdentity, relativePlan, assertDistinctParents, UNIT_TYPES, RELATIVE_ROLES } from './genealogy-rules.js';

const clip=(value,limit=200)=>typeof value==='string'?value.trim().slice(0,limit):'';
const uuid=(value,required=false)=> {
 const text=clip(value,60);
 if (!text && !required) return null;
 if (!isId(text)) throw new HttpError(400,'معرّف غير صالح؛ اختر سجلًا من القائمة');
 return text;
};
const field=(form,key,limit=200)=>clip(form.get(key),limit);
const requiredName=value=> {
 try {const name=cleanName(value);if(name.length<3)throw new Error('NAME_TOO_SHORT');return name;}
 catch {throw new HttpError(400,'اسم الشخص مطلوب ويجب ألا يقل عن ثلاثة أحرف');}
};
const safeDate=raw=>{ const value=clip(raw,10);if(!value)return null;const d=new Date(value+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==value)throw new HttpError(400,'تاريخ الميلاد غير صالح');return value;};
const hmacSecret=()=>process.env.DIWAN_ID_HMAC_KEY||process.env.NEON_AUTH_COOKIE_SECRET;
const identity=(number,type='national_id')=>{
 try{return fingerprintIdentity(number,type,hmacSecret());}
 catch{throw new HttpError(400,'نوع أو صيغة الهوية غير صالحة، أو لم يُضبط مفتاح التشفير');}
};
async function permit(user,permission){
 if(!await authorized(user,'roles.view') || !await authorized(user,permission))
  throw new HttpError(403,'صلاحيات إدارة سجلات النسب أو الهويات مطلوبة');
}
async function journal(db,user,action,target,recordId,meta={}){
 await db.query("insert into public.permission_audit_events(actor_user_id,event_type,outcome,metadata) values($1,$2,'success',$3::jsonb)",
  [user.id,action,JSON.stringify({target,id:recordId,...meta})]);
}
async function tribeExists(db,id) {
 const r=await db.query('select id from public.tribes where id=$1',[id]);
 if(!r.rowCount)throw new HttpError(404,'القبيلة غير موجودة');
}
async function getFamily(db,id,tribeId) {
 if(!id)return null;
 const r=await db.query("select id,name_ar,unit_type from public.lineage_units where id=$1 and tribe_id=$2",[id,tribeId]);
 if(!r.rowCount||!['family','house'].includes(r.rows[0].unit_type))
   throw new HttpError(400,'اختر عائلة أو بيتًا تابعًا للقبيلة');
 return r.rows[0];
}
async function getPerson(db,id) {
 if(!id)return null;
 const r=await db.query('select id,tribe_id,full_name_ar,gender,father_id,mother_id,record_status,family_unit_id from public.people where id=$1 for update',[id]);
 if(!r.rowCount)throw new HttpError(404,'الشخص غير موجود أو أزيل');
 if(r.rows[0].record_status==='archived')throw new HttpError(409,'السجل مؤرشف؛ استعده قبل الربط');
 return r.rows[0];
}
async function checkCycle(db,child,parent) {
 if(!parent)return;
 if(child===parent)throw new HttpError(409,'لا يمكن أن يصبح الفرد أبًا أو أمًا لنفسه');
 const r=await db.query(
  'with recursive ancestry(id,father_id,mother_id,depth,path) as ('+
  'select id,father_id,mother_id,0,array[id] from public.people where id=$1 '+
  'union all select p.id,p.father_id,p.mother_id,a.depth+1,a.path||p.id '+
  'from ancestry a join public.people p on (p.id=a.father_id or p.id=a.mother_id) '+
  'where a.depth<40 and not p.id=any(a.path)) select 1 from ancestry where id=$2 limit 1',
  [parent,child]);
 if(r.rowCount)throw new HttpError(409,'هذا الربط ينشئ دورة غير صحيحة في شجرة النسب');
}
async function connectParents(db,personId,fatherId,motherId,{newRecord=false}={}) {
 assertDistinctParents(fatherId,motherId,personId);
 const person=await getPerson(db,personId);
 for (const [role,id] of [['father',fatherId],['mother',motherId]]) {
  if(!id)continue;
  const parent=await getPerson(db,id);
  if(parent.gender!=='unknown' && parent.gender!=='undisclosed' && parent.gender!==(role==='father'?'male':'female'))
    throw new HttpError(409,'نوع الجنس في السجل لا يتفق مع صلة الأب أو الأم');
  if(person[role+'_id'] && person[role+'_id']!==id)
    throw new HttpError(409,'يوجد '+(role==='father'?'أب':'أم')+' مختلف مسجّل؛ يجب مراجعة التعارض أولًا');
  await checkCycle(db,personId,id);
  if(person[role+'_id']===id)continue;
  if(!newRecord && person.record_status==='verified') {
   const existing=await db.query("select id from public.parentage_assertions where child_id=$1 and parent_id=$2 and parent_role=$3 and status='pending' limit 1",[personId,id,role]);
   if(!existing.rowCount) await db.query("insert into public.parentage_assertions(child_id,parent_id,parent_role,basis,confidence,status) values($1,$2,$3,'reported','unverified','pending')",[personId,id,role]);
  } else {
   await db.query('update public.people set '+(role==='father'?'father_id':'mother_id')+'=$2,updated_at=now() where id=$1 and '+(role==='father'?'father_id':'mother_id')+' is null',[personId,id]);
  }
 }
}
async function candidate(db,role,data,tribeId,user,{isMain=false}={}) {
 const selected=uuid(data[role+'_id']);
 const name=clip(data[role+'_name'],200);
 const number=clip(data[role+'_identity'],50);
 const kind=clip(data[role+'_identity_kind'],30)||'national_id';
 if(!selected&&!name&&!number)return {id:null,created:false};
 if(number && !['national_id','residency','passport','birth_certificate'].includes(kind))
   throw new HttpError(400,'نوع وثيقة غير مدعوم');
 const hash=number?identity(number,kind):null;
 let match=null;
 if(hash) {
  const m=await db.query("select pi.person_id,p.full_name_ar,p.tribe_id from public.person_identifiers pi join public.people p on p.id=pi.person_id where pi.identifier_hmac=$1 and pi.identifier_type=$2 and pi.country_code='SA' and pi.status in ('pending','verified','disputed') limit 1",[hash.digest,kind]);
  match=m.rows[0]||null;
 }
 if(selected) {
  const p=await getPerson(db,selected);
  if(match && match.person_id!==selected)throw new HttpError(409,'الهوية تخص سجلًا آخر؛ لا يجوز ربطها بالشخص المختار');
  if(name && canonicalName(p.full_name_ar)!==canonicalName(name)) throw new HttpError(409,'الاسم المختار يختلف عن السجل؛ راجع هوية الشخص');
  if(hash && !match)await db.query("insert into public.person_identifiers(person_id,country_code,issuer,identifier_type,identifier_hmac,hmac_key_version,masked_value,status) values($1,'SA','admin-supplied',$2,$3,1,$4,'pending')",[selected,kind,hash.digest,'******'+hash.last4]);
  if(isMain)throw new HttpError(409,'الشخص موجود بالفعل؛ استخدم تعديل بيانات الفرد');
  const expected=RELATIVE_ROLES[role]?.gender;
  if(expected && p.gender!=='unknown' && p.gender!=='undisclosed' && p.gender!==expected) throw new HttpError(409,'السجل المختار لا يطابق جنس الجد أو الأصل');
  return {id:selected,created:false};
 }
 if(match) {
  if(isMain)throw new HttpError(409,'الهوية موجودة مسبقًا؛ افتح سجل الفرد وعدّله بدل تكراره');
  if(data.confirm_reuse!=='yes')throw new HttpError(409,'الهوية مسجلة مسبقًا؛ فعّل تأكيد استخدام السجل الموجود بعد مراجعة الاسم');
  const p=await getPerson(db,match.person_id);
  if(name && canonicalName(p.full_name_ar)!==canonicalName(name))throw new HttpError(409,'الهوية مطابقة لكن الاسم مختلف، راجع السجل الموجود أولًا');
  const expected=RELATIVE_ROLES[role]?.gender;
  if(expected && p.gender!=='unknown' && p.gender!=='undisclosed' && p.gender!==expected)throw new HttpError(409,'الجنس المسجل لا يناسب صلة القرابة المطلوبة');
  return {id:p.id,created:false};
 }
 const fullName=requiredName(name);
 const gender=isMain?(data.person_gender||'unknown'):(RELATIVE_ROLES[role]?.gender||'unknown');
 if(!['male','female','unknown','undisclosed'].includes(gender))throw new HttpError(400,'الجنس غير صالح');
 {
  const dup=await db.query("select id from public.people where tribe_id=$1 and (normalized_name=$2 or lower(full_name_ar)=lower($3)) and gender=$4 and record_status<>'archived' limit 1",[tribeId,canonicalName(fullName),fullName,gender]);
  if(dup.rowCount && data.allow_duplicate_name!=='yes')throw new HttpError(409,'اسم مشابه مسجل؛ ابحث عن الشخص وحدده بدل إضافته مرة ثانية، أو أكد تشابه الأسماء');
 }
 const familyUnit=isMain?uuid(data.person_family_id):null;
 if(isMain)await getFamily(db,familyUnit,tribeId);
 const dob=isMain?safeDate(data.person_birth_date):null;
 const born=isMain?clip(data.person_birth_place,120):null;
 const r=await db.query("insert into public.people(tribe_id,family_unit_id,given_name_ar,full_name_ar,normalized_name,gender,record_status,visibility,created_by,birth_date,birth_date_precision,birth_place) values($1,$2,$3,$4,$5,$6,'under_review','private',$7,$8,case when $8::date is null then 'unknown' else 'day' end,$9) returning id",
  [tribeId,familyUnit,fullName.split(' ')[0],fullName,canonicalName(fullName),gender,user.id,dob,born]);
 const id=r.rows[0].id;
 if(hash) await db.query("insert into public.person_identifiers(person_id,country_code,issuer,identifier_type,identifier_hmac,hmac_key_version,masked_value,status) values($1,'SA','admin-supplied',$2,$3,1,$4,'pending')",[id,kind,hash.digest,'******'+hash.last4]);
 return {id,created:true};
}
async function createFamilyTree(db,user,form) {
 const tribeId=uuid(form.get('tribe_id'),true);
 await tribeExists(db,tribeId);
 const data=Object.fromEntries([...form.entries()].filter(([k])=>k!=='csrf'&&k!=='operation').map(([k,v])=>[k,clip(v,250)]));
 data.person_name=requiredName(data.person_name);
 const plan=relativePlan(data);
 const ids={};
 const creations=[];
 for(const role of [...plan,'person']){
  const out=await candidate(db,role,data,tribeId,user,{isMain:role==='person'});
  if(out.id)ids[role]=out.id;
  if(out.created)creations.push(role);
 }
 if(ids.father) await connectParents(db,ids.father,ids.father_father||null,ids.father_mother||null,{newRecord:creations.includes('father')});
 if(ids.mother) await connectParents(db,ids.mother,ids.mother_father||null,ids.mother_mother||null,{newRecord:creations.includes('mother')});
 await connectParents(db,ids.person,ids.father||null,ids.mother||null,{newRecord:true});
 await journal(db,user,'genealogy_tree_created','people',ids.person,{recordsCreated:creations.length,hasFather:!!ids.father,hasMother:!!ids.mother,hasPaternalGrandparents:!!(ids.father_father||ids.father_mother),hasMaternalGrandparents:!!(ids.mother_father||ids.mother_mother)});
 return ids.person;
}
async function changePerson(db,user,form){
 const personId=uuid(form.get('id'),true);
 const person=await getPerson(db,personId);
 const name=requiredName(field(form,'full_name'));
 const gender=field(form,'gender',20);
 const dob=safeDate(form.get('birth_date'));
 const living=field(form,'living_status',20)||'unknown';
 if(!['alive','deceased','unknown'].includes(living))throw new HttpError(400,'حالة الحياة غير صالحة');
 const family=uuid(form.get('family_id'));
 if(!['male','female','unknown','undisclosed'].includes(gender))throw new HttpError(400,'الجنس غير صالح');
 await getFamily(db,family,person.tribe_id);
 const father=uuid(form.get('father_id')),mother=uuid(form.get('mother_id'));
 assertDistinctParents(father,mother,personId);
 if(father)await checkCycle(db,personId,father);
 if(mother)await checkCycle(db,personId,mother);
 if((person.father_id && person.father_id!==father)||(person.mother_id && person.mother_id!==mother)){
  // Removal or replacement of proven ancestors requires a separate evidence-review workflow.
  throw new HttpError(409,'لا يمكن حذف أو استبدال نسب مسجل مباشرة؛ ارفع طلب مراجعة وتصحيح أولًا');
 }
 await db.query("update public.people set full_name_ar=$2,given_name_ar=$3,normalized_name=$4,gender=$5,family_unit_id=$6,birth_place=$7,biography=$8,birth_date=$9,birth_date_precision=case when $9::date is null then 'unknown' else 'day' end,living_status=$10,record_status='under_review',visibility='private',updated_at=now() where id=$1",
  [personId,name,name.split(' ')[0],canonicalName(name),gender,family,field(form,'birth_place',120)||null,field(form,'biography',1000)||null,dob,living]);
 if(father||mother)await connectParents(db,personId,father,mother);
 await journal(db,user,'genealogy_person_updated','people',personId,{changedFields:['name','gender','family','bio','parents'],needsReview:true});
}
async function archivePerson(db,user,form,restore=false){
 const id=uuid(form.get('id'),true);
 if(form.get('confirm')!=='yes')throw new HttpError(400,'تأكيد الإجراء مطلوب');
 if(restore){
  const r=await db.query("update public.people set record_status='under_review',visibility='private',updated_at=now() where id=$1 and record_status='archived' returning id",[id]);
  if(!r.rowCount)throw new HttpError(409,'ليس سجلًا مؤرشفًا');
 }else{
  const attached=await db.query('select 1 from public.user_profiles where person_id=$1 limit 1',[id]);
  if(attached.rowCount)throw new HttpError(409,'السجل مرتبط بحساب عضو؛ يلزم فصل الحساب ومراجعته قبل الأرشفة');
  const r=await db.query("update public.people set record_status='archived',visibility='private',updated_at=now() where id=$1 and record_status<>'archived' returning id",[id]);
  if(!r.rowCount)throw new HttpError(409,'السجل مؤرشف مسبقًا');
 }
 await journal(db,user,restore?'genealogy_person_restored':'genealogy_person_archived','people',id);
}
async function deletePersonDraft(db,user,form){
 const id=uuid(form.get('id'),true);
 if(form.get('confirm')!=='delete')throw new HttpError(400,'يتطلب حذف المسودة تأكيدًا صريحًا');
 const r=await db.query("select id from public.people p where p.id=$1 and p.created_by=$2 and p.record_status in ('draft','under_review','archived') and not exists(select 1 from public.people c where c.father_id=p.id or c.mother_id=p.id) and not exists(select 1 from public.marriages m where m.partner_a_id=p.id or m.partner_b_id=p.id) and not exists(select 1 from public.parentage_assertions a where a.child_id=p.id or a.parent_id=p.id) and not exists(select 1 from public.user_profiles pr where pr.person_id=p.id) for update",[id,user.id]);
 if(!r.rowCount)throw new HttpError(409,'الحذف غير متاح لسجل مرتبط أو لشخص معتمد؛ استخدم الأرشفة');
 // Identifiers are securely removed only after making sure this draft has no dependent relationships.
 await db.query('delete from public.person_identifiers where person_id=$1',[id]);
 const removed=await db.query("delete from public.people where id=$1 returning id",[id]);
 if(!removed.rowCount)throw new HttpError(409,'تعذر حذف المسودة');
 await journal(db,user,'genealogy_draft_deleted','people',id);
}
async function ancestorOfUnit(db,unitId,tribeId,kind) {
 if(!unitId)return null;
 const r=await db.query(
  'with recursive parents(id,parent_id,unit_type,depth,path) as ('+
  'select id,parent_id,unit_type,0,array[id] from public.lineage_units where id=$1 and tribe_id=$2 '+
  'union all select u.id,u.parent_id,u.unit_type,p.depth+1,p.path||u.id from parents p join public.lineage_units u on u.id=p.parent_id and u.tribe_id=$2 where p.depth<30 and not u.id=any(p.path)) '+
  'select id from parents where unit_type=$3 order by depth limit 1',[unitId,tribeId,kind]);
 return r.rows[0]?.id||null;
}
async function checkUnit(db,unitId,tribeId){
 if(!unitId)return null;
 const r=await db.query('select id,tribe_id,parent_id,unit_type,name_ar from public.lineage_units where id=$1 and tribe_id=$2 for update',[unitId,tribeId]);
 if(!r.rowCount)throw new HttpError(400,'وحدة النسب أو القسم غير موجود');
 return r.rows[0];
}
async function createUnit(db,user,form){
 const tribeId=uuid(form.get('tribe_id'),true),parentId=uuid(form.get('parent_id'));
 const type=field(form,'unit_type',20),name=requiredName(field(form,'name',150));
 const sourceId=uuid(form.get('source_id'),true);
 if(!UNIT_TYPES.includes(type))throw new HttpError(400,'نوع الوحدة غير صالح');
 await tribeExists(db,tribeId);
 const source=(await db.query('select id from public.sources where id=$1 and tribe_id=$2',[sourceId,tribeId])).rows[0];
 if(!source)throw new HttpError(400,'المصدر يجب أن يتبع القبيلة');
 if(parentId)await checkUnit(db,parentId,tribeId);
 if(type==='family' && !await ancestorOfUnit(db,parentId,tribeId,'subclan'))throw new HttpError(400,'اختر فخذًا معتمدًا في التسلسل قبل إضافة العائلة');
 const d=await db.query("select id from public.lineage_units where tribe_id=$1 and parent_id is not distinct from $2 and normalized_name=$3 limit 1",[tribeId,parentId,canonicalName(name)]);
 if(d.rowCount)throw new HttpError(409,'وحدة باسم مطابق موجودة تحت الأصل نفسه');
 const r=await db.query('insert into public.lineage_units(tribe_id,parent_id,unit_type,name_ar,normalized_name) values($1,$2,$3,$4,$5) returning id',[tribeId,parentId,type,name,canonicalName(name)]);
 const id=r.rows[0].id;
 await db.query("insert into public.lineage_seed_reviews(unit_id,source_id,review_status,raw_source_path,reviewer_note) values($1,$2,'needs_review',$3,$4)",[id,sourceId,'admin/manual/'+id,'إضافة جديدة تحتاج تحققًا قبل النشر']);
 if(type==='subclan'){
  const major=await ancestorOfUnit(db,parentId,tribeId,'branch');
  if(!major)throw new HttpError(400,'يلزم اختيار فرع رئيسي قبل إضافة الفخذ');
  await db.query("insert into public.lineage_fakhths(unit_id,tribe_id,major_branch_id,source_id,raw_source_path,review_status) values($1,$2,$3,$4,$5,'needs_review')",[id,tribeId,major,sourceId,'admin/manual/'+id]);
 }
 if(type==='family'){
  const fakhth=await ancestorOfUnit(db,parentId,tribeId,'subclan');
  const found=await db.query('select 1 from public.lineage_fakhths where unit_id=$1 and tribe_id=$2',[fakhth,tribeId]);
  if(!found.rowCount)throw new HttpError(409,'الفخذ غير مدخل في دليل الفروع؛ راجع توثيقه أولًا');
  await db.query("insert into public.lineage_family_fakhth_links(family_unit_id,tribe_id,fakhth_unit_id,source_id,raw_source_path,review_status) values($1,$2,$3,$4,$5,'needs_review')",[id,tribeId,fakhth,sourceId,'admin/manual/'+id]);
 }
 await journal(db,user,'genealogy_unit_created','lineage_units',id,{unitType:type,sourceId,parentId,needsReview:true});
}
async function changeUnit(db,user,form){
 const id=uuid(form.get('id'),true),name=requiredName(field(form,'name',150)),parent=uuid(form.get('parent_id'));
 const current=(await db.query('select id,tribe_id,parent_id,unit_type from public.lineage_units where id=$1 for update',[id])).rows[0];
 if(!current)throw new HttpError(404,'وحدة النسب غير موجودة');
 if(parent===id)throw new HttpError(409,'لا يمكن جعل الوحدة أصلًا لنفسها');
 if(parent)await checkUnit(db,parent,current.tribe_id);
 if(parent!==current.parent_id){
  const refs=await db.query('select 1 from public.lineage_units where parent_id=$1 limit 1',[id]);
  if(refs.rowCount)throw new HttpError(409,'لا يمكن نقل وحدة تحتوي فروعًا؛ يلزم طلب إعادة هيكلة');
  const found=await db.query('with recursive family(id,parent_id,path) as (select id,parent_id,array[id] from public.lineage_units where id=$1 union all select u.id,u.parent_id,f.path||u.id from family f join public.lineage_units u on u.id=f.parent_id where not u.id=any(f.path)) select 1 from family where id=$2 limit 1',[parent,id]);
  if(found.rowCount)throw new HttpError(409,'نقل الوحدة يؤدي إلى دورة في شجرة الأنساب');
  if(current.unit_type==='family'){
   const fakhth=await ancestorOfUnit(db,parent,current.tribe_id,'subclan');
   if(!fakhth)throw new HttpError(409,'تغيير أصل العائلة يتطلب فخذًا صحيحًا');
   await db.query("update public.lineage_family_fakhth_links set fakhth_unit_id=$2,review_status='needs_review',verified_at=null,verified_by=null where family_unit_id=$1",[id,fakhth]);
  }
 }
 const match=await db.query('select 1 from public.lineage_units where tribe_id=$1 and parent_id is not distinct from $2 and normalized_name=$3 and id<>$4 limit 1',[current.tribe_id,parent,canonicalName(name),id]);
 if(match.rowCount)throw new HttpError(409,'يوجد اسم مطابق في هذه العائلة');
 await db.query('update public.lineage_units set name_ar=$2,normalized_name=$3,parent_id=$4 where id=$1',[id,name,canonicalName(name),parent]);
 await db.query("update public.lineage_seed_reviews set review_status='needs_review',verified_at=null,verified_by=null,reviewer_note=$2 where unit_id=$1",[id,'تعديل إداري يحتاج إعادة اعتماد']);
 await db.query("update public.lineage_fakhths set review_status='needs_review',verified_at=null,verified_by=null where unit_id=$1",[id]);
 await db.query("update public.lineage_family_fakhth_links set review_status='needs_review',verified_at=null,verified_by=null where family_unit_id=$1",[id]);
 await journal(db,user,'genealogy_unit_updated','lineage_units',id,{parentChanged:parent!==current.parent_id,needsReview:true});
}
async function withdrawUnit(db,user,form){
 const id=uuid(form.get('id'),true);
 if(form.get('confirm')!=='yes')throw new HttpError(400,'يلزم تأكيد إيقاف النشر');
 const r=await db.query("update public.lineage_seed_reviews set review_status='needs_review',verified_by=null,verified_at=null,reviewer_note='أوقف النشر للمراجعة الإدارية' where unit_id=$1 returning unit_id",[id]);
 if(!r.rowCount)throw new HttpError(404,'المراجعة غير موجودة');
 await db.query("update public.lineage_fakhths set review_status='needs_review',verified_by=null,verified_at=null where unit_id=$1",[id]);
 await db.query("update public.lineage_family_fakhth_links set review_status='needs_review',verified_by=null,verified_at=null where family_unit_id=$1",[id]);
 await journal(db,user,'genealogy_unit_publication_withdrawn','lineage_units',id);
}
async function deleteUnitDraft(db,user,form){
 const id=uuid(form.get('id'),true);
 if(form.get('confirm')!=='delete')throw new HttpError(400,'يرجى تأكيد حذف الوحدة غير المعتمدة');
 const entry=(await db.query('select unit_type,tribe_id from public.lineage_units where id=$1 for update',[id])).rows[0];
 if(!entry)throw new HttpError(404,'الوحدة غير موجودة');
 const review=(await db.query('select review_status,raw_source_path from public.lineage_seed_reviews where unit_id=$1 for update',[id])).rows[0];
 if(!review||review.review_status!=='needs_review'||!String(review.raw_source_path).startsWith('admin/manual/'))
   throw new HttpError(409,'لا يجوز حذف وحدة معتمدة أو مستوردة؛ استخدم إيقاف النشر والمراجعة');
 const dep=await db.query('select 1 from public.lineage_units where parent_id=$1 union all select 1 from public.people where family_unit_id=$1 limit 1',[id]);
 if(dep.rowCount)throw new HttpError(409,'الوحدة تحتوي أفرادًا أو فروعًا؛ احفظ التسلسل واستخدم المراجعة');
 await db.query('delete from public.lineage_family_fakhth_links where family_unit_id=$1',[id]);
 await db.query('delete from public.lineage_fakhths where unit_id=$1',[id]);
 await db.query('delete from public.lineage_seed_reviews where unit_id=$1',[id]);
 const deleted=await db.query('delete from public.lineage_units where id=$1 returning id',[id]);
 if(!deleted.rowCount)throw new HttpError(409,'لم يُحذف السجل');
 await journal(db,user,'genealogy_draft_unit_deleted','lineage_units',id,{unitType:entry.unit_type});
}
const ACTIONS={
 create_tree:['identity.edit',createFamilyTree],
 edit_person:['identity.edit',changePerson],
 archive_person:['identity.edit',(db,u,f)=>archivePerson(db,u,f)],
 restore_person:['identity.edit',(db,u,f)=>archivePerson(db,u,f,true)],
 delete_person_draft:['identity.edit',deletePersonDraft],
 create_unit:['lineage.structure_apply',createUnit],
 edit_unit:['lineage.structure_apply',changeUnit],
 withdraw_unit:['lineage.structure_apply',withdrawUnit],
 delete_unit_draft:['lineage.structure_apply',deleteUnitDraft],
};
export async function genealogyAction(user,form){
 const action=field(form,'operation',40),entry=ACTIONS[action];
 if(!entry)throw new HttpError(404,'الإجراء المطلوب غير معروف');
 await permit(user,entry[0]);
 const db=await pool.connect();
 try{await db.query('begin');await entry[1](db,user,form);await db.query('commit');}
 catch(error){await db.query('rollback');throw error;}
 finally{db.release();}
}
export async function genealogyIdentityLookup(user,req,form){
 await permit(user,'identity.read');
 const token=String(form.get('csrf')||''),expected=csrfFor(user,req);
 if(!/^[0-9a-f]{64}$/.test(token)||!timingSafeEqual(Buffer.from(token,'hex'),Buffer.from(expected,'hex')))
   throw new HttpError(403,'رمز الحماية غير صالح');
 const kind=field(form,'identifier_type',30);
 const raw=field(form,'identity',50);
 const hash=identity(raw,kind);
 const recent=await pool.query("select count(*)::int as total from public.permission_audit_events where actor_user_id=$1 and event_type='genealogy_identity_lookup' and created_at > now() - interval '1 minute'",[user.id]);
 if(Number(recent.rows[0]?.total||0)>=12)throw new HttpError(429,'تجاوزت الحد الآمن لطلبات مطابقة الهوية؛ حاول بعد دقيقة');
 const r=await pool.query("select p.id,p.full_name_ar,p.gender,p.record_status,pi.masked_value from public.person_identifiers pi join public.people p on p.id=pi.person_id where pi.identifier_type=$1 and pi.identifier_hmac=$2 and pi.status in ('pending','verified','disputed') limit 1",[kind,hash.digest]);
 const found=r.rows[0]||null;
 const db=await pool.connect();
 try{await journal(db,user,'genealogy_identity_lookup','person_identifiers',found?.id||null,{found:!!found,identifierType:kind});}
 finally{db.release();}
 return {matched:!!found,record:found};
}
export async function genealogyData(user,url){
 await permit(user,'identity.read');
 const q=clip(url.searchParams.get('q'),70);
 const unitQ=clip(url.searchParams.get('unit_q'),70);
 const peopleSQL="select p.id,p.full_name_ar,p.gender,p.record_status,p.family_unit_id,p.tribe_id,p.father_id,p.mother_id,p.birth_place,p.biography,p.created_at,l.name_ar as family_name,"+
  "(select pi.masked_value from public.person_identifiers pi where pi.person_id=p.id and pi.status<>'revoked' order by pi.created_at desc limit 1) as identity_mask "+
  "from public.people p left join public.lineage_units l on l.id=p.family_unit_id where ($1='' or position(lower($1) in lower(p.full_name_ar))>0) order by p.created_at desc limit 120";
 const focusPersonId=uuid(url.searchParams.get('person_id'));
 const childOfId=uuid(url.searchParams.get('child_of'));
 const focusUnitId=uuid(url.searchParams.get('unit_id'));
 const [tribes,people,units,sources,stats,directory,directoryUnits,focusPerson,focusUnit]=await Promise.all([
  pool.query('select id,name_ar from public.tribes order by name_ar limit 40'),
  pool.query(peopleSQL,[q]),
  pool.query("select l.id,l.tribe_id,l.parent_id,l.unit_type,l.name_ar,r.review_status from public.lineage_units l left join public.lineage_seed_reviews r on r.unit_id=l.id where ($1='' or position(lower($1) in lower(l.name_ar))>0) order by l.name_ar limit 550",[unitQ]),
  pool.query('select id,tribe_id,title,source_type from public.sources order by created_at desc limit 60'),
  pool.query("select (select count(*) from public.people) people,(select count(*) from public.people where record_status='under_review') drafts,(select count(*) from public.lineage_units) units,(select count(*) from public.lineage_seed_reviews where review_status='needs_review') unit_reviews"),
  pool.query("select p.id,p.full_name_ar,p.gender,p.record_status,(select pi.masked_value from public.person_identifiers pi where pi.person_id=p.id and pi.status<>'revoked' order by pi.created_at desc limit 1) identity_mask from public.people p where p.record_status<>'archived' order by p.full_name_ar limit 400"),
  pool.query('select id,tribe_id,parent_id,unit_type,name_ar from public.lineage_units order by name_ar limit 1200'),
  focusPersonId?pool.query("select p.id,p.full_name_ar,p.gender,p.record_status,p.family_unit_id,p.tribe_id,p.father_id,p.mother_id,p.birth_date,p.living_status,p.birth_place,p.biography from public.people p where p.id=$1 limit 1",[focusPersonId]):Promise.resolve({rows:[]}),
  focusUnitId?pool.query('select id,tribe_id,parent_id,unit_type,name_ar from public.lineage_units where id=$1 limit 1',[focusUnitId]):Promise.resolve({rows:[]})
 ]);
 const permissions=await Promise.all(['identity.edit','lineage.structure_apply'].map(key=>authorized(user,key)));
 return {tribes:tribes.rows,people:people.rows,directory:directory.rows,childOf:directory.rows.find(p=>p.id===childOfId)||null,directoryUnits:directoryUnits.rows,units:units.rows,focusedPerson:focusPerson.rows[0]||null,focusedUnit:focusUnit.rows[0]||null,sources:sources.rows,stats:stats.rows[0],canEditPeople:permissions[0],canEditUnits:permissions[1],q,unitQ};
}
