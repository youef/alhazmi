import { timingSafeEqual } from 'node:crypto';
import { sealPrivate, unsealPrivate } from './private-fields.js';
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
function registryDate(form,key){
 const raw=field(form,key,30);
 if(!raw)return {date:null,precision:'unknown'};
 const value=raw.replace(/[٠-٩۰-۹]/g, digit=>String(digit.charCodeAt(0)-(digit<='٩'?0x660:0x6f0)));
 if(!/^[1-9]\d{3}(-\d{2}(-\d{2})?)?$/.test(value))throw new HttpError(400,'اكتب التاريخ بصيغة سنة أو سنة-شهر أو سنة-شهر-يوم.');
 const format=value.length===4?'year':value.length===7?'month':'day';
 if(format!=='day'&&form.get(key+'_estimated')==='yes')
  throw new HttpError(400,'أدخل تاريخًا كاملًا إذا أردت وسمه بالتقريبي.');
 const date=safeDate(value+(format==='year'?'-01-01':format==='month'?'-01':''));
 return {date,precision:form.get(key+'_estimated')==='yes'?'estimated':format};
}
const validateParents=(father,mother,person)=>{try{assertDistinctParents(father,mother,person);}catch{throw new HttpError(409,'لا يجوز ربط شخص بنفسه أو اختيار الشخص نفسه للأب والأم');}};
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
 validateParents(fatherId,motherId,personId);
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
 const familyUnit=uuid(data[isMain?'person_family_id':role+'_family_id']);
 if(familyUnit)await getFamily(db,familyUnit,tribeId);
 const birth=isMain?registryDate(new URLSearchParams(data),'person_birth_date'):{date:null,precision:'unknown'};
 const born=isMain?clip(data.person_birth_place,120):null;
 const r=await db.query("insert into public.people(tribe_id,family_unit_id,given_name_ar,full_name_ar,normalized_name,gender,record_status,visibility,created_by,birth_date,birth_date_precision,birth_place) values($1,$2,$3,$4,$5,$6,'under_review','private',$7,$8,$10,$9) returning id",
  [tribeId,familyUnit,fullName.split(' ')[0],fullName,canonicalName(fullName),gender,user.id,birth.date,born,birth.precision]);
 const id=r.rows[0].id;
 if(hash) await db.query("insert into public.person_identifiers(person_id,country_code,issuer,identifier_type,identifier_hmac,hmac_key_version,masked_value,status) values($1,'SA','admin-supplied',$2,$3,1,$4,'pending')",[id,kind,hash.digest,'******'+hash.last4]);
 return {id,created:true};
}
async function createFamilyTree(db,user,form) {
 const tribeId=uuid(form.get('tribe_id'),true);
 await tribeExists(db,tribeId);
 const data=Object.fromEntries([...form.entries()].filter(([k])=>k!=='csrf'&&k!=='operation').map(([k,v])=>[k,clip(v,250)]));
 data.person_name=requiredName(data.person_name);
 let plan;
 try {plan=relativePlan(data);}catch {throw new HttpError(400,'لا يمكن إضافة الجد أو الجدة قبل تحديد الأب أو الأم في القسم السابق');}
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
 // Save contact, national address, education and private notes in the same transaction.
 const details=new URLSearchParams([...form.entries()]);
 details.set('id',ids.person);
 details.set('full_name',data.person_name);
 details.set('gender',data.person_gender||'unknown');
 details.set('family_id',data.person_family_id||'');
 details.set('birth_date',data.person_birth_date||'');
 details.set('birth_date_estimated',data.person_birth_date_estimated||'');
 details.set('birth_place',data.person_birth_place||'');
 details.set('father_id',ids.father||'');
 details.set('mother_id',ids.mother||'');
 details.set('identity',data.person_identity||'');
 details.set('identifier_type',data.person_identity_kind||'national_id');
 await changePerson(db,user,details);
 await journal(db,user,'genealogy_tree_created','people',ids.person,{recordsCreated:creations.length,hasFather:!!ids.father,hasMother:!!ids.mother,hasPaternalGrandparents:!!(ids.father_father||ids.father_mother),hasMaternalGrandparents:!!(ids.mother_father||ids.mother_mother)});
 return ids.person;
}
const PRIVATE_INPUTS=[
 ['phone_ciphertext','phone',32],
 ['email_ciphertext','email',254],
 ['employer_ciphertext','employer',200],
 ['job_title_ciphertext','job_title',160],
 ['private_notes_ciphertext','private_notes',5000],
];
const ADDRESS_INPUTS=[
 ['short_code',12],['building_number',8],['street',160],['district',130],
 ['postal_code',10],['additional_number',10],['unit_number',20],
 ['address_details',750]
];
function privateAddress(form){
 const obj={};
 for(const [key,max] of ADDRESS_INPUTS)obj[key]=field(form,'address_'+key,max);
 if(obj.postal_code && !/^\d{5}$/.test(obj.postal_code))throw new HttpError(400,'الرمز البريدي يجب أن يتكون من خمسة أرقام');
 if(obj.building_number && !/^\d{4}$/.test(obj.building_number))throw new HttpError(400,'رقم المبنى يجب أن يتكون من أربعة أرقام');
 if(obj.additional_number && !/^\d{4}$/.test(obj.additional_number))throw new HttpError(400,'الرقم الإضافي يجب أن يتكون من أربعة أرقام');
 return Object.values(obj).some(Boolean)?JSON.stringify(obj):null;
}
async function updatePrivateDetails(db,user,form,personId){
 const identifier=field(form,'identity',50),kind=field(form,'identifier_type',30)||'national_id';
 const remove=field(form,'remove_identity',10)==='yes';
 if(remove&&identifier)throw new HttpError(400,'اختر إزالة الهوية أو إضافة رقم بديل، وليس الإجراءين معًا');
 if(!['national_id','residency','passport','birth_certificate'].includes(kind))throw new HttpError(400,'نوع الهوية غير صالح');
 const current=await db.query("select id,status,identifier_type,identifier_hmac from public.person_identifiers where person_id=$1 and status<>'revoked' for update",[personId]);
 const prior=await db.query('select * from public.person_private where person_id=$1 for update',[personId]);
 let idCipher=prior.rows[0]?.national_id_ciphertext||null;
 let last4=prior.rows[0]?.national_id_last4||null;
 if(remove){
   if(current.rows.some(row=>row.status==='verified'))throw new HttpError(409,'الهوية المعتمدة تتطلب طلب تصحيح ومراجعة قبل إلغائها');
   await db.query("update public.person_identifiers set status='revoked',encrypted_value=null,masked_value=null where person_id=$1 and status in ('pending','disputed')",[personId]);
   idCipher=null;last4=null;
 }else if(identifier){
   const hashed=identity(identifier,kind);
   const other=await db.query("select 1 from public.person_identifiers where identifier_type=$1 and identifier_hmac=$2 and person_id<>$3 and status<>'revoked' limit 1",[kind,hashed.digest,personId]);
   if(other.rowCount)throw new HttpError(409,'رقم الوثيقة مرتبط بشخص آخر؛ يلزم مراجعة التطابق');
   const matching=current.rows.find(row=>row.identifier_type===kind&&row.identifier_hmac.equals(hashed.digest));
   if(!matching){
     if(current.rows.some(row=>row.identifier_type===kind&&row.status==='verified'))throw new HttpError(409,'لا يمكن استبدال هوية معتمدة مباشرة؛ ارفع طلب تصحيح');
     await db.query("update public.person_identifiers set status='revoked',encrypted_value=null,masked_value=null where person_id=$1 and identifier_type=$2 and status in ('pending','disputed')",[personId,kind]);
     await db.query("insert into public.person_identifiers(person_id,country_code,issuer,identifier_type,identifier_hmac,hmac_key_version,masked_value,status,encrypted_value) values($1,'SA','admin-supplied',$2,$3,1,$4,'pending',$5)",[personId,kind,hashed.digest,'******'+hashed.last4,sealPrivate(identifier,personId,'identity:'+kind)]);
   }
   idCipher=sealPrivate(identifier,personId,'national_id');
   last4=hashed.last4;
 }
 const email=field(form,'email',254);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new HttpError(400,'البريد الإلكتروني غير صالح');
 const phone=field(form,'phone',32);
 if(phone&&!/^\+?[0-9 \-()]{7,32}$/.test(phone))throw new HttpError(400,'رقم الجوال غير صالح');
 const values={person_id:personId,national_id_ciphertext:idCipher,national_id_last4:last4};
 for(const [col,name,max] of PRIVATE_INPUTS)values[col]=sealPrivate(field(form,name,max),personId,name);
 values.national_address_ciphertext=sealPrivate(privateAddress(form),personId,'national_address');
 values.city=field(form,'city',100)||null;
 values.region=field(form,'region',100)||null;
 values.country=field(form,'country',2).toUpperCase()||'SA';
 if(!/^[A-Z]{2}$/.test(values.country))throw new HttpError(400,'رمز الدولة يجب أن يكون بحرفين');
 values.employment_status=field(form,'employment_status',30)||null;
 if(values.employment_status&&!['employed','self_employed','unemployed','student','retired','unknown'].includes(values.employment_status))throw new HttpError(400,'الحالة الوظيفية غير صالحة');
 values.education_level=field(form,'education_level',120)||null;
 const columns=Object.keys(values),params=Object.values(values);
 const insert='insert into public.person_private('+columns.join(',')+') values('+columns.map((_,i)=>'$'+(i+1)).join(',')+')';
 const update=columns.filter(k=>k!=='person_id').map(k=>k+'=excluded.'+k).join(',');
 await db.query(insert+' on conflict(person_id) do update set '+update+',updated_at=now()',params);
 await journal(db,user,'genealogy_private_details_updated','person_private',personId,{identityChanged:!!(identifier||remove),fields:['contact','address','work','education','private_notes']});
}
async function changePerson(db,user,form){
 const personId=uuid(form.get('id'),true);
 const person=await getPerson(db,personId);
 const name=requiredName(field(form,'full_name'));
 const gender=field(form,'gender',20);
 const birth=registryDate(form,'birth_date');
 const death=registryDate(form,'death_date');
 const living=field(form,'living_status',20)||'unknown';
 if(!['alive','deceased','unknown'].includes(living))throw new HttpError(400,'حالة الحياة غير صالحة');
 if(living==='alive'&&death.date)throw new HttpError(400,'لا يمكن تسجيل تاريخ وفاة لشخص حي');
 const family=uuid(form.get('family_id'));
 if(!['male','female','unknown','undisclosed'].includes(gender))throw new HttpError(400,'الجنس غير صالح');
 await getFamily(db,family,person.tribe_id);
 const father=uuid(form.get('father_id')),mother=uuid(form.get('mother_id'));
 validateParents(father,mother,personId);
 if(father)await checkCycle(db,personId,father);
 if(mother)await checkCycle(db,personId,mother);
 if((person.father_id&&person.father_id!==father)||(person.mother_id&&person.mother_id!==mother))
   throw new HttpError(409,'لا يمكن حذف أو استبدال نسب مسجل مباشرة؛ ارفع طلب مراجعة وتصحيح أولًا');
 await updatePrivateDetails(db,user,form,personId);
 await db.query("update public.people set full_name_ar=$2,given_name_ar=$3,normalized_name=$4,gender=$5,family_unit_id=$6,birth_place=$7,biography=$8,birth_date=$9,birth_date_precision=$12,living_status=$10,death_date=$11,death_date_precision=$13,middle_name_ar=case when $14::boolean then $15 else middle_name_ar end,surname_ar=case when $16::boolean then $17 else surname_ar end,record_status='under_review',visibility='private',updated_at=now() where id=$1",
  [personId,name,field(form,'given_name',100)||name.split(' ')[0],canonicalName(name),gender,family,field(form,'birth_place',120)||null,field(form,'biography',4000)||null,birth.date,living,death.date,birth.precision,death.precision,form.has('middle_name'),field(form,'middle_name',150)||null,form.has('surname'),field(form,'surname',100)||null]);
 if(father||mother)await connectParents(db,personId,father,mother);
 await journal(db,user,'genealogy_person_updated','people',personId,{changedFields:['name','gender','family','birth','death','bio','parents','private_details'],needsReview:true});
}

const FAMILY_RELATIONS={
 father:{parent:'self',slot:'father',gender:'male'},
 mother:{parent:'self',slot:'mother',gender:'female'},
 father_father:{parent:'father',slot:'father',gender:'male'},
 father_mother:{parent:'father',slot:'mother',gender:'female'},
 mother_father:{parent:'mother',slot:'father',gender:'male'},
 mother_mother:{parent:'mother',slot:'mother',gender:'female'},
 child:{parent:'child'},
 spouse:{parent:'spouse'}
};
function relationGender(role,raw){
 const expected=FAMILY_RELATIONS[role]?.gender;
 const gender=expected||raw||'unknown';
 if(!['male','female','unknown','undisclosed'].includes(gender))throw new HttpError(400,'الجنس المسجل للقريب غير صالح');
 return gender;
}
function sameLineageFamily(person,role,parent){
 // Only infer paternal family ancestry; maternal relatives and spouses may
 // belong to different houses, and must not be assigned one implicitly.
 if(role==='father'||(role==='child'&&person.gender==='male'))return person.family_unit_id||null;
 if((role==='father_father'||role==='mother_father')&&parent)return parent.family_unit_id||null;
 return null;
}
async function addPersonRelation(db,user,form){
 const personId=uuid(form.get('person_id'),true),person=await getPerson(db,personId);
 const role=field(form,'relation_role',30),spec=FAMILY_RELATIONS[role];
 if(!Object.hasOwn(FAMILY_RELATIONS,role))throw new HttpError(400,'نوع صلة القرابة غير مدعوم');
 if(role==='child'&&!['male','female'].includes(person.gender))
  throw new HttpError(409,'حدد جنس الفرد الأساسي أولًا لربط الأبناء بالأب أو الأم بصورة صحيحة');
 let parent=person;
 if(spec.parent==='father'||spec.parent==='mother'){
  const parentId=person[spec.parent+'_id'];
  if(!parentId)throw new HttpError(409,'أضف '+(spec.parent==='father'?'الأب':'الأم')+' إلى سجل الفرد أولًا، ثم أضف الجد أو الجدة');
  parent=await getPerson(db,parentId);
 }
 const selectedId=uuid(form.get('relative_id'));
 const fullName=field(form,'relative_name',200);
 const identityValue=field(form,'relative_identity',50);
 const kind=field(form,'relative_identity_kind',30)||'national_id';
 const hash=identityValue?identity(identityValue,kind):null;
 let identified=null;
 if(hash){
  const matched=await db.query("select p.id,p.tribe_id,p.full_name_ar from public.person_identifiers i join public.people p on p.id=i.person_id where i.country_code='SA' and i.identifier_type=$1 and i.identifier_hmac=$2 and i.status in ('pending','verified','disputed') limit 1",[kind,hash.digest]);
  identified=matched.rows[0]||null;
 }
 if(selectedId&&hash&&identified?.id!==selectedId)
  throw new HttpError(409,'رقم الهوية المدخل يعود لسجل مختلف عن الشخص المختار');
 const existingId=selectedId||identified?.id||null;
 if(identified&&!selectedId&&field(form,'confirm_reuse',5)!=='yes')
  throw new HttpError(409,'الهوية موجودة مسبقًا؛ وافق على ربط سجل الشخص الموجود بعد مراجعة اسمه');
 let relative,created=false;
 if(existingId){
  relative=await getPerson(db,existingId);
  if(relative.tribe_id!==person.tribe_id)throw new HttpError(409,'السجل من قبيلة مختلفة؛ يلزم مراجعة ارتباطه أولًا');
  if(fullName&&canonicalName(relative.full_name_ar)!==canonicalName(fullName))
   throw new HttpError(409,'الهوية أو السجل المختار يعود لاسم مختلف؛ تحقق من الاسم قبل الربط');
  const expected=spec.gender;
  if(expected&&relative.gender!==expected)
   throw new HttpError(409,'جنس الشخص المسجل لا يتوافق مع صلة الأب أو الأم أو الأجداد');
  if(hash&&!identified){
   await db.query("insert into public.person_identifiers(person_id,country_code,issuer,identifier_type,identifier_hmac,hmac_key_version,masked_value,status,encrypted_value) values($1,'SA','admin-supplied',$2,$3,1,$4,'pending',$5)",[relative.id,kind,hash.digest,'******'+hash.last4,sealPrivate(identityValue,relative.id,'identity:'+kind)]);
   await journal(db,user,'genealogy_identifier_added_to_relative','person_identifiers',relative.id,{type:kind});
  }
 }else{
  const name=requiredName(fullName);
  const gender=relationGender(role,field(form,'relative_gender',20));
  if(role==='child'&&!['male','female'].includes(gender))throw new HttpError(400,'اختر ابنًا أو ابنة بتحديد الجنس.');
  const livingStatus=field(form,'relative_living_status',20)||'unknown';
  if(!['alive','deceased','unknown'].includes(livingStatus))throw new HttpError(400,'حالة الحياة غير صالحة');
  const duplicate=await db.query("select id from public.people where tribe_id=$1 and normalized_name=$2 and record_status<>'archived' limit 1",[person.tribe_id,canonicalName(name)]);
  if(duplicate.rowCount)throw new HttpError(409,'اسم مطابق موجود سابقًا؛ ابحث عنه وحدده أو أدخل رقم الهوية لتفادي التكرار');
  const explicitFamily=uuid(form.get('relative_family_id'));
  if(explicitFamily)await getFamily(db,explicitFamily,person.tribe_id);
  const family=explicitFamily||sameLineageFamily(person,role,parent);
  const born=safeDate(form.get('relative_birth_date'));
  const inserted=await db.query("insert into public.people(tribe_id,family_unit_id,given_name_ar,full_name_ar,normalized_name,gender,birth_date,birth_date_precision,birth_place,living_status,record_status,visibility,created_by) values($1,$2,$3,$4,$5,$6,$7,case when $7::date is null then 'unknown' else 'day' end,$8,$9,'under_review','private',$10) returning id",
   [person.tribe_id,family,name.split(' ')[0],name,canonicalName(name),gender,born,field(form,'relative_birth_place',120)||null,livingStatus,user.id]);
  relative={id:inserted.rows[0].id,tribe_id:person.tribe_id,gender,full_name_ar:name,father_id:null,mother_id:null,record_status:'under_review',family_unit_id:family};
  created=true;
  const details=new URLSearchParams();
  for(const key of ['phone','email','city','region','country','employment_status','education_level','employer','job_title','private_notes',
    'address_short_code','address_building_number','address_street','address_district',
    'address_postal_code','address_additional_number','address_unit_number','address_address_details']){
    details.set(key,String(form.get('relative_'+key)||''));
  }
  details.set('identity',identityValue);
  details.set('identifier_type',kind);
  await updatePrivateDetails(db,user,details,relative.id);
 }
 if(relative.id===person.id||relative.id===parent.id)
  throw new HttpError(409,'لا يجوز ربط شخص بنفسه كأحد أقاربه');
 if(role==='spouse'){
  const current=await db.query("select id,status from public.marriages where (partner_a_id=$1 and partner_b_id=$2) or (partner_a_id=$2 and partner_b_id=$1) order by created_at desc limit 1",[person.id,relative.id]);
  if(current.rowCount)throw new HttpError(409,'توجد علاقة زواج مسجلة بين الشخصين بالفعل؛ راجعها بدل إضافتها مرة أخرى');
  await db.query("insert into public.marriages(partner_a_id,partner_b_id,start_date,status,notes) values($1,$2,$3,'reported',$4)",[person.id,relative.id,safeDate(form.get('marriage_start_date')),'إضافة إدارية تنتظر التوثيق']);
 }else if(role==='child'){
  const otherId=uuid(form.get('co_parent_id'));
  if(!otherId)throw new HttpError(400,'اختر الأب أو الأم الآخر بالهوية أو من الأزواج المرتبطين.');
  const coIdentity=field(form,'co_parent_identity',50);
  if(coIdentity){
   const coKind=field(form,'co_parent_identity_kind',30)||'national_id';
   const coHash=identity(coIdentity,coKind);
   const matched=await db.query("select 1 from public.person_identifiers where person_id=$1 and country_code='SA' and identifier_type=$2 and identifier_hmac=$3 and status in ('pending','verified','disputed')",[otherId,coKind,coHash.digest]);
   if(!matched.rowCount)throw new HttpError(409,'هوية الأب أو الأم الآخر لا تطابق السجل المختار.');
  }
  let other=null;
  if(otherId){
   const linked=await db.query("select 1 from public.marriages where ((partner_a_id=$1 and partner_b_id=$2) or (partner_a_id=$2 and partner_b_id=$1)) and status in ('reported','current') limit 1",[person.id,otherId]);
   if(!linked.rowCount)throw new HttpError(409,'الطرف الآخر غير مسجل كزوج أو زوجة في علاقة قائمة أو مُبلّغ عنها');
   other=await getPerson(db,otherId);
   if(other.gender===(person.gender==='male'?'male':'female')||!['male','female'].includes(other.gender))
    throw new HttpError(409,'جنس الطرف الآخر لا يتوافق مع دور الأب أو الأم؛ تحقق من بيانات الزوجين');
  }
  const father=person.gender==='male'?person.id:(other?.id||null);
  const mother=person.gender==='female'?person.id:(other?.id||null);
  await connectParents(db,relative.id,father,mother,{newRecord:created});
 }else{
  await connectParents(db,parent.id,spec.slot==='father'?relative.id:null,spec.slot==='mother'?relative.id:null,{newRecord:false});
 }
 await journal(db,user,'genealogy_relation_added','people',person.id,{relativeId:relative.id,relation:role,created,needsReview:true});
 return person.id;
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
async function registrationParent(db,unitId,tribeId,type){
 const ancestor=type==='family'
  ?'join public.lineage_fakhths f on f.unit_id=a.id and f.tribe_id=$2'
  :"where a.unit_type='branch' and a.parent_id is null";
 const result=await db.query(
  'with recursive parents(id,parent_id,unit_type,depth,path) as ('+
  'select id,parent_id,unit_type,0,array[id] from public.lineage_units where id=$1 and tribe_id=$2 '+
  'union all select u.id,u.parent_id,u.unit_type,a.depth+1,a.path||u.id from parents a join public.lineage_units u on u.id=a.parent_id and u.tribe_id=$2 where not u.id=any(a.path)) '+
  'select a.id from parents a '+ancestor+' order by a.depth limit 1',[unitId,tribeId]);
 if(!result.rowCount)throw new HttpError(400,type==='family'?'اختر أصلًا تابعًا لفخذ مسجل في القبيلة.':'اختر أصلًا تابعًا لفرع رئيسي في القبيلة.');
 return result.rows[0].id;
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
 const registryParent=['family','subclan'].includes(type)?await registrationParent(db,parentId,tribeId,type):null;
 const d=await db.query("select id from public.lineage_units where tribe_id=$1 and parent_id is not distinct from $2 and normalized_name=$3 limit 1",[tribeId,parentId,canonicalName(name)]);
 if(d.rowCount)throw new HttpError(409,'وحدة باسم مطابق موجودة تحت الأصل نفسه');
 const r=await db.query('insert into public.lineage_units(tribe_id,parent_id,unit_type,name_ar,normalized_name) values($1,$2,$3,$4,$5) returning id',[tribeId,parentId,type,name,canonicalName(name)]);
 const id=r.rows[0].id;
 await db.query("insert into public.lineage_seed_reviews(unit_id,source_id,review_status,raw_source_path,reviewer_note) values($1,$2,'needs_review',$3,$4)",[id,sourceId,'admin/manual/'+id,'إضافة جديدة تحتاج تحققًا قبل النشر']);
 if(type==='subclan'){
  const major=registryParent;
  await db.query("insert into public.lineage_fakhths(unit_id,tribe_id,major_branch_id,source_id,raw_source_path,review_status) values($1,$2,$3,$4,$5,'needs_review')",[id,tribeId,major,sourceId,'admin/manual/'+id]);
 }
 if(type==='family'){
  const fakhth=registryParent;
  await db.query("insert into public.lineage_family_fakhth_links(family_unit_id,tribe_id,fakhth_unit_id,source_id,raw_source_path,review_status) values($1,$2,$3,$4,$5,'needs_review')",[id,tribeId,fakhth,sourceId,'admin/manual/'+id]);
 }
 await journal(db,user,'genealogy_unit_created','lineage_units',id,{unitType:type,sourceId,parentId,needsReview:true});
 return id;
}
async function changeUnit(db,user,form){
 const id=uuid(form.get('id'),true),name=requiredName(field(form,'name',150)),parent=uuid(form.get('parent_id'));
 const current=(await db.query('select l.id,l.tribe_id,l.parent_id,l.unit_type,exists(select 1 from public.lineage_fakhths f where f.unit_id=l.id) as registered_fakhth from public.lineage_units l where l.id=$1 for update',[id])).rows[0];
 if(!current)throw new HttpError(404,'وحدة النسب غير موجودة');
 if(parent===id)throw new HttpError(409,'لا يمكن جعل الوحدة أصلًا لنفسها');
 if(parent)await checkUnit(db,parent,current.tribe_id);
 const parentChanged=parent!==current.parent_id;
 const isFakhth=current.unit_type==='subclan'||current.registered_fakhth;
 const updateFamilyLink=current.unit_type==='family'&&(parentChanged||form.get('ensure_fakhth')==='yes');
 let registryParent;
 if(updateFamilyLink||(parentChanged&&isFakhth)){
  registryParent=await registrationParent(db,parent,current.tribe_id,current.unit_type);
 }
 if(parentChanged){
  if(current.unit_type!=='family'){
   const refs=await db.query('select 1 from public.lineage_units where parent_id=$1 limit 1',[id]);
   if(refs.rowCount)throw new HttpError(409,'لا يمكن نقل فخذ يحتوي وحدات تابعة؛ يمكن تعديل اسمه أو نقل العائلات أولًا.');
  }
  const found=await db.query('with recursive family(id,parent_id,path) as (select id,parent_id,array[id] from public.lineage_units where id=$1 union all select u.id,u.parent_id,f.path||u.id from family f join public.lineage_units u on u.id=f.parent_id where not u.id=any(f.path)) select 1 from family where id=$2 limit 1',[parent,id]);
  if(found.rowCount)throw new HttpError(409,'نقل الوحدة يؤدي إلى دورة في شجرة الأنساب');
 }
 const match=await db.query('select 1 from public.lineage_units where tribe_id=$1 and parent_id is not distinct from $2 and normalized_name=$3 and id<>$4 limit 1',[current.tribe_id,parent,canonicalName(name),id]);
 if(match.rowCount)throw new HttpError(409,'يوجد اسم مطابق في هذه العائلة');
 await db.query('update public.lineage_units set name_ar=$2,normalized_name=$3,parent_id=$4,'+
  'name_en=case when $5::boolean then $6 else name_en end,description=case when $7::boolean then $8 else description end where id=$1',
  [id,name,canonicalName(name),parent,form.has('name_en'),field(form,'name_en',150)||null,form.has('description'),field(form,'description',2000)||null]);
 if(updateFamilyLink){
  const link=await db.query(
   "insert into public.lineage_family_fakhth_links(family_unit_id,tribe_id,fakhth_unit_id,source_id,raw_source_path,review_status) "+
   "select $1,$2,$3,r.source_id,r.raw_source_path,'needs_review' from public.lineage_seed_reviews r where r.unit_id=$1 "+
   "on conflict(family_unit_id) do update set fakhth_unit_id=excluded.fakhth_unit_id,review_status='needs_review',verified_at=null,verified_by=null",
   [id,current.tribe_id,registryParent]);
  if(!link.rowCount)throw new HttpError(409,'أضف مصدر توثيق للعائلة قبل تغيير الفخذ المرتبط بها.');
 }
 if(parentChanged&&isFakhth){
  await db.query("update public.lineage_fakhths set major_branch_id=$2 where unit_id=$1",[id,registryParent]);
 }
 await db.query("update public.lineage_seed_reviews set review_status='needs_review',verified_at=null,verified_by=null,reviewer_note=$2 where unit_id=$1",[id,'تعديل إداري يحتاج إعادة اعتماد']);
 await db.query("update public.lineage_fakhths set review_status='needs_review',verified_at=null,verified_by=null where unit_id=$1",[id]);
 await db.query("update public.lineage_family_fakhth_links set review_status='needs_review',verified_at=null,verified_by=null where family_unit_id=$1",[id]);
 await journal(db,user,'genealogy_unit_updated','lineage_units',id,{parentChanged,needsReview:true});
 return id;
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
   throw new HttpError(409,'الحذف الدائم متاح للمسودات اليدوية غير المرتبطة فقط. إذا كانت الوحدة منشورة، اختر إيقاف النشر للمراجعة.');
 const dep=await db.query('select 1 from public.lineage_units where parent_id=$1 union all select 1 from public.people where family_unit_id=$1 union all select 1 from public.lineage_family_fakhth_links where fakhth_unit_id=$1 limit 1',[id]);
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
 add_relation:['identity.edit',addPersonRelation],
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
 try{
  await db.query('begin');
  if(['create_unit','edit_unit','withdraw_unit','delete_unit_draft','create_tree','add_relation','edit_person'].includes(action)){
   await db.query('select pg_advisory_xact_lock(723145, 1)');
  }
  const result=await entry[1](db,user,form);
  await db.query('commit');
  return result;
 }
 catch(error){
  await db.query('rollback');
  if(action==='delete_unit_draft'&&error?.code==='23503')
   throw new HttpError(409,'ترتبط هذه الوحدة بسجلات أخرى. أوقف النشر بدل حذفها.');
  throw error;
 }
 finally{db.release();}
}
export async function genealogyIdentityLookup(user,req,form,{relative=false}={}){
 await permit(user,'identity.read');
 if(relative)await permit(user,'identity.edit');
 const token=String(form.get('csrf')||''),expected=csrfFor(user,req);
 if(!/^[0-9a-f]{64}$/.test(token)||!timingSafeEqual(Buffer.from(token,'hex'),Buffer.from(expected,'hex')))
   throw new HttpError(403,'رمز الحماية غير صالح');
 const kind=field(form,'identifier_type',30);
 const raw=field(form,'identity',50);
 const hash=identity(raw,kind);
 const recent=await pool.query("select count(*)::int as total from public.permission_audit_events where actor_user_id=$1 and event_type='genealogy_identity_lookup' and created_at > now() - interval '1 minute'",[user.id]);
 if(Number(recent.rows[0]?.total||0)>=12)throw new HttpError(429,'تجاوزت الحد الآمن لطلبات مطابقة الهوية؛ حاول بعد دقيقة');
 const r=await pool.query("select p.id,p.full_name_ar,p.gender,p.record_status,pi.masked_value,f.name_ar family_name,k.name_ar fakhth_name from public.person_identifiers pi join public.people p on p.id=pi.person_id left join public.lineage_units f on f.id=p.family_unit_id left join public.lineage_family_fakhth_links l on l.family_unit_id=p.family_unit_id left join public.lineage_units k on k.id=l.fakhth_unit_id where pi.country_code='SA' and pi.identifier_type=$1 and pi.identifier_hmac=$2 and pi.status in ('pending','verified','disputed') limit 1",[kind,hash.digest]);
 const found=r.rows[0]||null;
 const db=await pool.connect();
 try{await journal(db,user,'genealogy_identity_lookup','person_identifiers',found?.id||null,{found:!!found,identifierType:kind});}
 finally{db.release();}
 if(relative&&found&&(found.record_status==='archived'||found.id===form.get('person_id')))
  throw new HttpError(409,'هذا السجل مؤرشف أو هو نفس سجل الفرد المفتوح.');
 return {matched:!!found,record:found};
}
export async function genealogyData(user,url){
 await permit(user,'identity.read');
 const q=clip(url.searchParams.get('q'),70);
 const unitQ=clip(url.searchParams.get('unit_q'),70);
 const view=clip(url.searchParams.get('view'),16)||(!q&&!url.searchParams.has('people_page')&&(unitQ||url.searchParams.has('unit_page'))?'units':'people');
 const personStatus=clip(url.searchParams.get('person_status'),24);
 const gap=clip(url.searchParams.get('gap'),16);
 const pageNumber=key=>{
  const value=clip(url.searchParams.get(key),10);
  return /^[1-9]\d{0,8}$/.test(value)?Number(value):1;
 };
 const page=pageNumber('people_page');
 const unitPage=pageNumber('unit_page');
 const pageSize=40;
 const peopleSQL="select p.id,p.full_name_ar,p.gender,p.record_status,l.name_ar as family_name,"+
  "father.full_name_ar as father_name,mother.full_name_ar as mother_name,"+
  "(select pi.masked_value from public.person_identifiers pi where pi.person_id=p.id and pi.status<>'revoked' order by pi.created_at desc limit 1) as identity_mask "+
  "from public.people p left join public.lineage_units l on l.id=p.family_unit_id "+
  "left join public.people father on father.id=p.father_id left join public.people mother on mother.id=p.mother_id "+
  "where ($1='' or position(lower($1) in lower(p.full_name_ar))>0) and ($4='' or p.record_status=$4) "+
  "and ($5 not in ('birth','family') or ($5='birth' and p.birth_date is null) or ($5='family' and p.family_unit_id is null)) "+
  "order by p.created_at desc,p.id desc limit $2 offset $3";
 const focusPersonId=uuid(url.searchParams.get('person_id'));
 const childOfId=uuid(url.searchParams.get('child_of'));
 const focusUnitId=uuid(url.searchParams.get('unit_id'));
 const permissions=await Promise.all(['identity.edit','lineage.structure_apply'].map(key=>authorized(user,key)));
 const personEditor=Boolean(focusPersonId&&permissions[0]);
 const unitEditor=Boolean(focusUnitId&&permissions[1]);
 const creation=Boolean(permissions[0]&&(childOfId||view==='create'));
 const unitRegistry=view==='units'||Boolean(focusUnitId);
 const personRegistry=!creation&&!unitRegistry&&view!=='identity'&&!(view==='sources'&&permissions[1]);
 const queryWhen=(condition,sql,args=[])=>condition?pool.query(sql,args):Promise.resolve({rows:[]});
 const [tribes,people,units,sources,stats,directory,directoryUnits,focusPerson,focusUnit,selectedPeople]=await Promise.all([
  queryWhen(creation||unitRegistry&&permissions[1],'select id,name_ar from public.tribes order by name_ar limit 40'),
  queryWhen(personRegistry,peopleSQL,[q,pageSize+1,(page-1)*pageSize,personStatus,gap]),
  queryWhen(unitRegistry,"select l.id,l.tribe_id,l.parent_id,l.unit_type,l.name_ar,r.review_status from public.lineage_units l left join public.lineage_seed_reviews r on r.unit_id=l.id where ($1='' or position(lower($1) in lower(l.name_ar))>0) order by l.name_ar,l.id limit $2 offset $3",[unitQ,pageSize+1,(unitPage-1)*pageSize]),
  queryWhen(permissions[1]&&(unitRegistry||view==='sources'),'select id,tribe_id,title,source_type,author,publication_year from public.sources order by created_at desc,id'),
  queryWhen(personRegistry&&!personEditor,"select (select count(*) from public.people) people,(select count(*) from public.people where record_status='under_review') drafts,(select count(*) from public.lineage_units) units,(select count(*) from public.lineage_seed_reviews where review_status='needs_review') unit_reviews,(select count(*) from public.people where birth_date is null) missing_birth,(select count(*) from public.people where family_unit_id is null) missing_family"),
  queryWhen(personEditor||creation,"select p.id,p.full_name_ar,p.gender,p.record_status,(select pi.masked_value from public.person_identifiers pi where pi.person_id=p.id and pi.status<>'revoked' order by pi.created_at desc limit 1) identity_mask from public.people p where p.record_status<>'archived' order by p.full_name_ar limit 400"),
  queryWhen(personEditor||creation||unitRegistry&&permissions[1],
   'select u.id,u.tribe_id,u.parent_id,u.unit_type,u.name_ar,l.fakhth_unit_id,f.unit_id is not null registered_fakhth from public.lineage_units u left join public.lineage_family_fakhth_links l on l.family_unit_id=u.id left join public.lineage_fakhths f on f.unit_id=u.id order by u.name_ar,u.id'),
  queryWhen(personEditor,"select p.id,p.full_name_ar,p.gender,p.record_status,p.family_unit_id,p.tribe_id,p.father_id,p.mother_id,p.given_name_ar,p.middle_name_ar,p.surname_ar,p.birth_date,p.birth_date_precision,p.death_date,p.death_date_precision,p.living_status,p.birth_place,p.biography,pp.* from public.people p left join public.person_private pp on pp.person_id=p.id where p.id=$1 limit 1",[focusPersonId]),
  queryWhen(unitEditor,`select l.id,l.tribe_id,l.parent_id,l.unit_type,l.name_ar,l.name_en,l.description,
   s.title as source_title,r.review_status,coalesce(r.raw_source_path like 'admin/manual/%',false) as manual_draft,
   (exists (select 1 from public.lineage_units child where child.parent_id=l.id)
   or exists (select 1 from public.people p where p.family_unit_id=l.id)
   or exists (select 1 from public.lineage_family_fakhth_links f where f.fakhth_unit_id=l.id)) as has_links
   from public.lineage_units l left join public.lineage_seed_reviews r on r.unit_id=l.id
   left join public.sources s on s.id=r.source_id where l.id=$1 limit 1`,[focusUnitId]),
  queryWhen(personEditor||creation&&childOfId,
    "select p.id,p.full_name_ar,p.gender,p.record_status from public.people p where "+
    "(p.id=$1 and p.record_status<>'archived') or p.id in "+
    "(select father_id from public.people where id=$2 union select mother_id from public.people where id=$2)",
    [childOfId,focusPersonId]
  )
 ]);
 // Fetch only one focused person's family graph, never all genealogy profiles.
 const [ancestors,spouses,children,birthRecords]=focusPerson.rows[0]&&permissions[0]?await Promise.all([
  pool.query("with relatives as (select father_id id from public.people where id=$1 union select mother_id from public.people where id=$1 union select gp.father_id from public.people child join public.people gp on gp.id in (child.father_id,child.mother_id) where child.id=$1 union select gp.mother_id from public.people child join public.people gp on gp.id in (child.father_id,child.mother_id) where child.id=$1) select p.id,p.full_name_ar,p.gender,p.record_status,p.family_unit_id,p.father_id,p.mother_id,f.name_ar family_name from public.people p left join public.lineage_units f on f.id=p.family_unit_id where p.id in (select id from relatives) limit 12",[focusPersonId]),
  pool.query("select m.id marriage_id,m.status marriage_status,m.start_date,m.end_date,p.id,p.full_name_ar,p.gender,p.record_status,p.family_unit_id,f.name_ar family_name from public.marriages m join public.people p on p.id=case when m.partner_a_id=$1 then m.partner_b_id else m.partner_a_id end left join public.lineage_units f on f.id=p.family_unit_id where m.partner_a_id=$1 or m.partner_b_id=$1 order by m.created_at desc limit 50",[focusPersonId]),
  pool.query("select p.id,p.full_name_ar,p.gender,p.record_status,p.family_unit_id,p.father_id,p.mother_id,f.name_ar family_name from public.people p left join public.lineage_units f on f.id=p.family_unit_id where p.father_id=$1 or p.mother_id=$1 order by p.birth_date nulls last,p.full_name_ar limit 160",[focusPersonId]),
  pool.query('select b.born_on,b.birth_place_text,b.status,s.title source_title from public.person_birth_records b left join public.sources s on s.id=b.source_id where b.person_id=$1 order by b.registration_date desc nulls last,b.id',[focusPersonId])
 ]):[{rows:[]},{rows:[]},{rows:[]},{rows:[]}];

 const focused=focusPerson.rows[0]||null;
 if(focused&&permissions[0]){
   for(const [column,name] of PRIVATE_INPUTS)
     focused[name]=unsealPrivate(focused[column],focused.id,name);
   const address=unsealPrivate(focused.national_address_ciphertext,focused.id,'national_address');
   focused.private_address=address?JSON.parse(address):{};
 }
 if(focused){
   for(const key of ['national_id_ciphertext','phone_ciphertext','email_ciphertext','national_address_ciphertext','employer_ciphertext','job_title_ciphertext','private_notes_ciphertext'])delete focused[key];
 }
 const parentOptions=new Map(directory.rows.map(person=>[person.id,person]));
 for(const person of selectedPeople.rows){
   if(!parentOptions.has(person.id))parentOptions.set(person.id,person);
 }
 return {tribes:tribes.rows,people:people.rows.slice(0,pageSize),peoplePage:page,hasMorePeople:people.rows.length>pageSize,
   directory:[...parentOptions.values()],childOf:parentOptions.get(childOfId)||null,directoryUnits:directoryUnits.rows,units:units.rows.slice(0,pageSize),unitPage,hasMoreUnits:units.rows.length>pageSize,focusedPerson:focused,birthRecords:birthRecords.rows,relations:{ancestors:ancestors.rows,spouses:spouses.rows,children:children.rows},focusedUnit:focusUnit.rows[0]||null,sources:sources.rows,stats:stats.rows[0]||{},canEditPeople:permissions[0],canEditUnits:permissions[1],q,unitQ,view,personStatus,gap};
}
