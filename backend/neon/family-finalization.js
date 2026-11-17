
import { HttpError, isId } from './shared.js';
const val=(v,n=700)=>typeof v==='string'?v.trim().slice(0,n):'';
const identity=v=>{if(!isId(v||''))throw new HttpError(400,'Invalid record identifier');return v;};
const requireProof=form=>{
 if(form.get('confirm_evidence')!=='yes')throw new HttpError(403,'Evidence review must be confirmed');
 const note=val(form.get('note'));
 if(note.length<15)throw new HttpError(400,'A 15-character review rationale is required');
 return note;
};
const journal=(db,user,operation,entity,id,meta)=>db.query(
 'insert into public.audit_log(actor_user_id,operation,entity_table,entity_id,after_data) values($1,$2,$3,$4,$5::jsonb)',
 [user.id,operation,entity,id,JSON.stringify(meta)]
);
export async function verifyPersonRecord(db,user,form){
 const request=identity(form.get('request')),note=requireProof(form);
 const item=(await db.query("select q.created_person_id,q.status,q.linked_person_id,p.record_status from public.diwan_family_relation_requests q join public.people p on p.id=q.created_person_id where q.id=$1 for update of q,p",[request])).rows[0];
 if(!item||item.status!=='approved'||!item.created_person_id||item.record_status!=='under_review'||item.linked_person_id)throw new HttpError(409,'Person is missing, already verified, or is an existing person record');
 await db.query("update public.people set record_status='verified',updated_at=now() where id=$1 and record_status='under_review'",[item.created_person_id]);
 await journal(db,user,'diwan_person_verified','people',item.created_person_id,{requestId:request,note});
}
export async function linkVerifiedAccount(db,user,form){
 const userId=identity(form.get('account')),personId=identity(form.get('person')),note=requireProof(form);
 const profile=(await db.query("select id,tribe_id,family_unit_id from public.people where id=$1 and record_status='verified' and family_unit_id is not null",[personId])).rows[0];
 if(!profile)throw new HttpError(403,'Only a verified person in an existing family may be linked to a user account');
 const account=(await db.query('select id from neon_auth."user" where id=$1 and "emailVerified" is true and banned is distinct from true',[userId])).rows[0];
 if(!account)throw new HttpError(403,'User email must be verified');
 await db.query('select auth.link_verified_neon_user($1::uuid)',[userId]);
 const r=await db.query("insert into public.user_profiles(user_id,person_id,account_status) values($1,$2,'active') on conflict(user_id) do update set person_id=excluded.person_id,account_status='active' where (user_profiles.person_id is null or user_profiles.person_id=excluded.person_id) and user_profiles.account_status not in ('suspended','frozen','archived') returning user_id",[userId,personId]);
 if(!r.rows.length)throw new HttpError(409,'الحساب موقوف أو مرتبط بفرد آخر. راجع حالة العضوية قبل الربط.');
 await journal(db,user,'diwan_verified_user_person_link','user_profiles',personId,{targetAccount:userId,note});
 await db.query("insert into public.notifications(user_id,category,title,body,related_record_id) values($1,'membership','تم ربط حسابك بسجل نسب موثّق','راجع ملفك الشخصي ومهامك في بوابة الديوان.',$2)",[userId,personId]);
}
export async function verifyFamilyConnection(db,user,form){
 const request=identity(form.get('request')),note=requireProof(form);
 const q=(await db.query('select * from public.diwan_family_relation_requests where id=$1 and status=$2 and lineage_verified_at is null for update',[request,'approved'])).rows[0];
 if(!q||!q.created_person_id||!q.anchor_person_id)throw new HttpError(409,'A reviewed relation between two existing people is required');
 const related=(await db.query("select id,gender,tribe_id,record_status from public.people where id=any($1::uuid[]) for update",[ [q.anchor_person_id,q.created_person_id] ])).rows;
 if(related.length!==2||related.some(p=>p.record_status!=='verified')||related.some(p=>p.tribe_id!==q.tribe_id))throw new HttpError(403,'Both related people must be verified and belong to the same tribe');
 const anchor=related.find(p=>p.id===q.anchor_person_id);
 let kind='other';
 if(['son','daughter','father','mother'].includes(q.relationship)){
  let child=q.created_person_id,parent=q.anchor_person_id,role;
  if(['father','mother'].includes(q.relationship)){
   child=q.anchor_person_id;parent=q.created_person_id;role=q.relationship;
  }else{
   role=anchor.gender==='male'?'father':anchor.gender==='female'?'mother':null;
  }
  if(!role)throw new HttpError(400,'Parent gender is unknown; verify the parent role first');
  const col=role==='father'?'father_id':'mother_id';
  const current=(await db.query('select father_id,mother_id from public.people where id=$1 for update',[child])).rows[0];
  if(!current||current[col]&&current[col]!==parent)throw new HttpError(409,'Verified parentage already conflicts with this request');
  // The existing cycle detection trigger rejects invalid parent pointers.
  await db.query('update public.people set '+col+'=$1,updated_at=now() where id=$2 and '+col+' is not distinct from $3::uuid',[parent,child,current[col]||null]);
  const updated=await db.query("update public.parentage_assertions set status='approved',basis='documented',confidence='reviewed' where child_id=$1 and parent_id=$2 and parent_role=$3 and status='pending' returning id",[child,parent,role]);
  if(!updated.rows.length)await db.query("insert into public.parentage_assertions(child_id,parent_id,parent_role,basis,confidence,status) values($1,$2,$3,'documented','reviewed','approved')",[child,parent,role]);
  kind='parentage';
 }else if(q.relationship==='spouse'&&q.marriage_id){
  const marriage=await db.query("update public.marriages set status='current' where id=$1 and status='reported' and partner_a_id=$2 and partner_b_id=$3 returning id",[q.marriage_id,q.anchor_person_id,q.created_person_id]);
  if(!marriage.rows.length)throw new HttpError(409,'Marriage was changed or is already verified');
  kind='marriage';
 }else{
  throw new HttpError(400,'Grandparents, aunts, uncles and grandchildren are derived from approved parentage; verify their intermediate parent links first');
 }
 await db.query('update public.diwan_family_relation_requests set lineage_verified_at=now(),lineage_verified_by=$1,lineage_verification_note=$2,updated_at=now() where id=$3',[user.id,note,request]);
 await journal(db,user,'diwan_family_connection_verified','diwan_family_relation_requests',request,{kind,anchor:q.anchor_person_id,related:q.created_person_id,note});
}
export async function shareOwnName(db,user,form){
 if(!user.person_id)throw new HttpError(403,'Your own verified person record is required');
 const item=(await db.query('select id from public.people where id=$1 and record_status=$2',[user.person_id,'verified'])).rows[0];
 if(!item)throw new HttpError(403,'Verified owner required');
 const email=val(form.get('viewer_email'),254).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new HttpError(400,'Enter a valid viewer email');
 const viewer=(await db.query('select id from neon_auth."user" where lower(email)=$1 and "emailVerified" is true',[email])).rows[0];
 if(!viewer)throw new HttpError(404,'The intended viewer must have a verified account');
 await db.query('select auth.link_verified_neon_user($1::uuid)',[viewer.id]);
 await db.query("insert into public.diwan_person_visibility_consents(person_id,allowed_user_id,show_name,consent_recorded_by) values($1,$2,true,$3) on conflict(person_id,allowed_user_id) do update set show_name=true,revoked_at=null,consent_at=now(),consent_recorded_by=excluded.consent_recorded_by",[user.person_id,viewer.id,user.id]);
 await journal(db,user,'diwan_name_visibility_consent','diwan_person_visibility_consents',user.person_id,{allowedViewer:viewer.id});
}
export async function revokeOwnNameShare(db,user,form){
 if(!user.person_id)throw new HttpError(403,'Person record required');
 const viewerId=identity(form.get('viewer'));
 const r=await db.query('update public.diwan_person_visibility_consents set revoked_at=now() where person_id=$1 and allowed_user_id=$2 and revoked_at is null returning person_id',[user.person_id,viewerId]);
 if(!r.rows.length)throw new HttpError(404,'No active name share for this viewer');
 await journal(db,user,'diwan_name_visibility_revoked','diwan_person_visibility_consents',user.person_id,{viewer:viewerId});
}
