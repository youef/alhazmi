
import { escapeHtml as escape, page } from './member-views.js';
const e=v=>escape(v??'');
const fmt=v=>new Intl.NumberFormat('ar-SA').format(Number(v||0));
const date=v=>v?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeZone:'Asia/Riyadh'}).format(new Date(v)):'—';
const status={
 submitted:'جديد',under_review:'قيد المراجعة',needs_evidence:'يتطلب إثباتًا',
 approved:'قبول أولي',rejected:'مرفوض',withdrawn:'ملغى',
 diwan_fakhth_supervisor:'مشرف فخذ',diwan_family_supervisor:'مشرف عائلة',diwan_parent_supervisor:'مشرف أسرة'
};
const relationshipLabels={
 self:'سجل شخص أولي',spouse:'زوجة / زوج',son:'ابن',daughter:'ابنة',father:'أب',mother:'أم',
 grandson:'حفيد',granddaughter:'حفيدة',paternal_uncle:'عم',paternal_aunt:'عمة',
 maternal_uncle:'خال',maternal_aunt:'خالة',paternal_grandfather:'جد من الأب',
 paternal_grandmother:'جدة من الأب',maternal_grandfather:'جد من الأم',
 maternal_grandmother:'جدة من الأم',guardian:'ولي أو معيل',
 child:'ابن/ابنة',grandchild_or_descendant:'حفيد أو من الذرية'
};
const css=[
'.family-shell{max-width:1190px;margin:0 auto}',
'.family-banner{background:linear-gradient(120deg,#07462f,#0a7850);padding:32px;color:#fff;border-radius:23px;margin-bottom:18px}',
'.family-banner h1{font-size:clamp(1.6rem,3.5vw,2.5rem);margin-bottom:6px}',
'.family-banner p{color:#e1f5e9;max-width:760px}',
'.family-breadcrumb{font-size:.85rem;margin-bottom:12px;color:#647d6c}.family-breadcrumb a{color:#0a704a}',
'.family-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:16px}',
'.family-card{background:#fff;border:1px solid #dce9e0;padding:23px;border-radius:18px;margin:17px 0;box-shadow:0 8px 27px #003e2c0a}',
'.family-card h2{font-size:1.19rem;color:#09533b;margin:0 0 12px}.family-card h3{font-size:1rem;color:#174a36}',
'.family-sub{color:#65776a;font-size:.85rem;line-height:1.75}',
'.family-form{display:grid;gap:13px}',
'.family-form label{display:grid;gap:5px;font-size:.9rem;font-weight:700}',
'.family-form input,.family-form textarea,.family-form select{background:#fff;border:1px solid #d0e2d7;color:#163b2c;border-radius:11px;padding:10px 12px;min-width:0;max-width:100%;min-height:44px;font:inherit}',
'.family-form textarea{min-height:90px}',
'.family-form input:focus,.family-form select:focus,.family-form textarea:focus{outline:2px solid #27a36a;outline-offset:1px}',
'.family-btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#006b45;color:#fff;font-weight:800;min-height:45px;padding:10px 16px;border:0;border-radius:11px;cursor:pointer}',
'.family-btn:hover{background:#08553b}.family-btn.secondary{background:#ecf6f0;color:#056342}',
'.family-pill{font-size:.77rem;padding:5px 10px;border-radius:22px;background:#eef5f0;color:#0a6d49;display:inline-flex;align-items:center;gap:5px}',
'.family-pill.warning{color:#845d19;background:#fff5dc}.family-pill.negative{color:#9e3737;background:#ffefed}',
'.family-pillrow{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0}',
'.family-table-wrap{max-width:100%;overflow:auto}.family-table{width:100%;border-collapse:collapse;font-size:.86rem;white-space:nowrap}',
'.family-table th,.family-table td{text-align:start;border-bottom:1px solid #e1ece5;padding:12px;vertical-align:middle}',
'.family-table th{color:#58705e;background:#f7faf7;font-size:.78rem}.family-table tr:last-child td{border-bottom:0}',
'.family-empty{padding:23px;color:#6b7b71;text-align:center;background:#f9fcfa;border:1px dashed #cee3d5;border-radius:12px}',
'.family-callout{background:#f1f8f3;border:1px solid #cfecdb;padding:13px 15px;border-radius:12px;color:#286046;font-size:.84rem}',
'.family-warning{background:#fff9e9;border-color:#efdbad;color:#795923}',
'.family-details{padding:13px;border-radius:12px;border:1px solid #d6e5da;margin:9px 0}.family-details summary{cursor:pointer;color:#086b45;font-weight:750}',
'.family-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:12px 0}',
'.family-checkbox{display:flex!important;align-items:center;flex-direction:row;gap:10px}.family-checkbox input{min-height:18px;width:18px}',
'.family-roles{display:flex;flex-wrap:wrap;gap:8px}',
'.family-relation-item{display:flex;gap:12px;align-items:center;padding:11px;border-bottom:1px solid #e5eee8}',
'.family-relation-item:last-child{border-bottom:0}',
'.family-relation-glyph{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#eaf5ed;color:#036b45}',
'.family-slim{font-size:.8rem;color:#68796c}.family-selectlong{width:100%}',
'.family-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}',
'.family-stat{padding:15px;background:#fff;border:1px solid #dfebdf;border-radius:13px}.family-stat strong{font-size:1.7rem;color:#065d3e;display:block}.family-stat small{color:#63786a;font-size:.76rem}',
'@media(max-width:600px){.family-card{padding:16px}.family-banner{padding:22px}.family-stats{grid-template-columns:repeat(2,1fr)}}'
].join('');
const form=(action,operation,csrf,body,button)=>
 '<form class="family-form" method="post" action="'+e(action)+'"><input type="hidden" name="csrf" value="'+e(csrf)+'"><input type="hidden" name="operation" value="'+e(operation)+'">'+body+'<button class="family-btn" type="submit">'+e(button)+'</button></form>';
const options=(items,key,label,emptyLabel='اختر من القائمة')=>
 '<option value="">'+e(emptyLabel)+'</option>'+items.map(x=>'<option value="'+e(x[key])+'"'+(x.fakhth_id?' data-fakhth="'+e(x.fakhth_id)+'"':'')+(x.family_id?' data-family="'+e(x.family_id)+'"':'')+'>'+e(label(x))+'</option>').join('');
const select=(label,name,rows,key,text,required=false)=>
 '<label>'+e(label)+'<select class="family-selectlong" name="'+e(name)+'" '+(required?'required':'')+'>'+options(rows,key,text)+'</select></label>';
const pills=x=>'<span class="family-pill '+(x==='rejected'?'negative':x==='needs_evidence'?'warning':'')+'">'+e(status[x]||x||'—')+'</span>';
const row=xs=>'<tr>'+xs.map(x=>'<td>'+x+'</td>').join('')+'</tr>';
const table=(columns,rows)=>rows.length?'<div class="family-table-wrap"><table class="family-table"><thead><tr>'+columns.map(x=>'<th>'+e(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>':'<div class="family-empty">لا توجد بيانات ضمن هذا القسم حاليًا.</div>';
export function familyAdminView(data,csrf,done){
 const inviteFields='<label>البريد الإلكتروني للمستخدم<input name="email" type="email" autocomplete="email" maxlength="254" required placeholder="user@example.com"></label>'
 +'<label>الاسم المعروض<input name="name" maxlength="100" placeholder="اسم الشخص"></label>'
 +'<label>مستوى الإشراف<select name="role" required><option value="diwan_fakhth_supervisor">مشرف فخذ</option><option value="diwan_family_supervisor">مشرف عائلة</option><option value="diwan_parent_supervisor">مشرف أسرة</option></select></label>'
 +select('الفخذ الموجود','fakhth',data.fakhths,'id',v=>v.root+' / '+v.name,true)
 +select('العائلة التابعة للفخذ — مطلوب لمشرف العائلة والأب','family',data.families,'id',v=>v.name+' (فخذ '+(data.fakhths.find(f=>f.id===v.fakhth_id)?.name||'')+')')
 +select('شخص الأب المعتمد — مطلوب لمشرف الأسرة','parent',data.parents,'id',v=>v.name)
 +'<div class="family-callout">يُضاف المستخدم بدعوة معتمدة. يسجل بنفسه ويتحقق من بريده ويقبل الدعوة، دون مشاركة كلمة مروره مع الإدارة.</div>';
 const pendingInvites=data.invitations.map(i=>row([
  '<b dir="ltr">'+e(i.invited_email)+'</b><div class="family-slim">'+e(i.invited_name||'')+'</div>',
  e(status[i.role_key]),e(i.fakhth_unit_id?data.fakhths.find(x=>x.id===i.fakhth_unit_id)?.name:'—'),
  i.revoked_at?pills('rejected'):i.accepted_at?pills('approved'):pills('submitted'),e(date(i.created_at)),
  !i.revoked_at&&!i.accepted_at?form('/admin/supervisors','revoke_invite',csrf,'<input type="hidden" name="invite" value="'+e(i.id)+'">','إلغاء الدعوة'):'—'
 ]));
 const supervisors=(data.activeSupervisors||[]).map(a=>row([
  e(a.email),e(a.role_name),e(a.scope_type),e(date(a.expires_at)),
  form('/admin/supervisors','revoke_supervision',csrf,'<input type="hidden" name="assignment" value="'+e(a.id)+'">','سحب الإشراف')
 ]));
 const queue=data.queue.map(q=>{
  const open=['submitted','under_review','needs_evidence'].includes(q.status);
  const next=open?'<details class="family-details"><summary>مراجعة الطلب</summary>'+form('/admin/supervisors','review',csrf,
   '<input type="hidden" name="request" value="'+e(q.id)+'"><input type="hidden" name="expected" value="'+e(q.status)+'">'
   +'<label>القرار<select name="decision"><option value="under_review">بدء المراجعة</option><option value="needs_evidence">طلب إثباتات</option><option value="rejected">رفض</option><option value="approved">قبول أولي كسجل غير موثّق</option></select></label>'
   +'<label>ملاحظات وإثباتات المراجعة<textarea name="note" required minlength="10" maxlength="700"></textarea></label>'
   +'<label class="family-checkbox"><input type="checkbox" name="confirm_evidence" value="yes"> أؤكد مراجعة الإثباتات قبل الموافقة الأولية</label>',
   'تسجيل القرار')+'</details>':'<span class="family-slim">تم البت</span>';
  let followUp='';
  if(q.status==='approved'&&q.created_person_id&&q.person_record_status==='under_review'){
   followUp=form('/admin/supervisors','verify_person',csrf,
    '<input type="hidden" name="request" value="'+e(q.id)+'">'
    +'<label>مبرر التوثيق<textarea name="note" required minlength="15" maxlength="700"></textarea></label>'
    +'<label class="family-checkbox"><input type="checkbox" name="confirm_evidence" value="yes" required> تحققت من الأدلة وهوية الشخص</label>',
    'توثيق سجل الشخص');
  }else if(q.status==='approved'&&q.created_person_id&&q.person_record_status==='verified'&&q.anchor_person_id&&!q.lineage_verified_at&&['son','daughter','father','mother','spouse'].includes(q.relationship)){
   followUp=form('/admin/supervisors','verify_connection',csrf,
    '<input type="hidden" name="request" value="'+e(q.id)+'">'
    +'<label>مبرر توثيق القرابة<textarea name="note" required minlength="15" maxlength="700"></textarea></label>'
    +'<label class="family-checkbox"><input type="checkbox" name="confirm_evidence" value="yes" required> تحققت من صلة القرابة ومستنداتها</label>',
    'اعتماد العلاقة النهائية');
  }
  const details=q.proposed_details||{};
  const dataCard='<details class="family-details"><summary>بيانات مقدم الطلب</summary>'
   +'<p>تاريخ الميلاد: '+e(q.proposed_birth_date?date(q.proposed_birth_date):'غير مذكور')+'</p>'
   +'<p>الجنس: '+e(q.proposed_gender||'غير محدد')+'</p>'
   +'<p>الأب: '+e(details.father_name_ar||'غير مذكور')+'</p>'
   +'<p>الأم: '+e(details.mother_name_ar||'غير مذكور')+'</p>'
   +'<p>مكان الميلاد: '+e(details.birthplace||'غير مذكور')+'</p>'
   +'<p>الجنسية: '+e(details.nationality||'غير مذكورة')+'</p>'
   +'<p>مرجع الإثبات: '+e(details.record_reference||'غير مذكور')+'</p>'
   +'<p>الوثيقة: '+e(q.identifier_type||'غير مذكور')+(q.identifier_last4?' (آخر 4 أحرف فقط: '+e(q.identifier_last4)+')':'')+'</p>'
   +'<p>ملاحظات: '+e(q.proposed_notes||'لا توجد')+'</p></details>';
  return row([e(q.proposed_name_ar),e(relationshipLabels[q.relationship]||q.relationship),
   e(q.family_name)+' / '+e(q.fakhth_name),e(q.email),pills(q.status),dataCard+next+followUp]);
 });
 const linkFields=select('المستخدم صاحب البريد المؤكد','account',data.accounts,'id',a=>a.email,true)
  +select('السجل الموثّق المطلوب ربطه','person',data.parents,'id',p=>p.name,true)
  +'<label>مبرر التحقق من الهوية<textarea name="note" minlength="15" maxlength="700" required></textarea></label>'
  +'<label class="family-checkbox"><input type="checkbox" name="confirm_evidence" value="yes" required> طابقت المستندات مع صاحب الحساب</label>';
 const linkCard=data.parents.length?form('/admin/supervisors','link_account',csrf,linkFields,'ربط الحساب بالشخص'):'<div class="family-empty">لا توجد سجلات أشخاص موثّقة بعد. أضف سجلاً أوليًا ثم اعتمده على مرحلتين.</div>';
  const content='<div class="family-shell">'
 +'<div class="family-breadcrumb"><a href="/admin">الإدارة</a> / إدارة المشرفين والأنساب</div>'
 +'<div class="family-banner"><h1>مركز الإشراف على الأفخاذ والعوائل</h1><p>توزيع الأدوار وربط كل مشرف بالفخذ أو العائلة أو الشخص الموثّق، وإدارة طلبات إضافة أفراد الأسرة ومراجعة القرابة.</p></div>'
 +(done?'<div class="family-callout" role="status">تم تنفيذ الإجراء وحفظه بنجاح.</div>':'')
 +'<div class="family-stats"><div class="family-stat"><strong>'+fmt(data.fakhths.length)+'</strong><small>الأفخاذ المسجلة</small></div><div class="family-stat"><strong>'+fmt(data.families.length)+'</strong><small>العائلات المرتبطة</small></div><div class="family-stat"><strong>'+fmt(data.queue.filter(x=>['submitted','under_review','needs_evidence'].includes(x.status)).length)+'</strong><small>طلبات حديثة بانتظار القرار</small></div></div>'
 +'<div class="family-grid"><section class="family-card"><h2>إضافة مستخدم ومنح نطاق إشراف</h2><p class="family-sub">اختر الفخذ الموجود فعلًا، ثم عائلة منه للمستويين الثاني والثالث.</p>'+form('/admin/supervisors','invite',csrf,inviteFields,'إنشاء دعوة إشراف')+'</section>'
 +'<section class="family-card"><h2>حسابات المستخدمين المسجلة</h2>'+table(['المستخدم','البريد'],data.accounts.map(u=>row([e(u.name||'مستخدم'),'<span dir="ltr">'+e(u.email)+'</span>'])))+'</section></div>'
 +'<section class="family-card"><h2>سجل دعوات الإشراف</h2>'+table(['الحساب','الدور','الفخذ','الحالة','أنشئت','إلغاء'],pendingInvites)+'</section>'
 +'<section class="family-card"><h2>المشرفون الفعّالون وسحب صلاحياتهم</h2>'+table(['المستخدم','الدور','النطاق','ينتهي','الإجراء'],supervisors)+'</section>'
 +'<section class="family-card"><h2>ربط حساب مستخدم بسجل نسب موثّق</h2><p class="family-callout family-warning">الربط يتطلب التحقق المستقل من هوية صاحب الحساب؛ مجرد تطابق الاسم أو البريد لا يكفي.</p>'+linkCard+'</section>'
 +'<section class="family-card"><h2>مراجعة إضافات الأسرة والقرابة</h2><p class="family-callout family-warning">رقم الهوية وحده لا يثبت النسب. القبول الأولي ينشئ سجلًا خاصًا قيد التحقق، وروابط الأبوة أو الزواج تبقى غير موثّقة حتى مراجعتها.</p>'+table(['الاسم','صلة القرابة','النطاق','مقدم الطلب','الحالة','الإجراء'],queue)+'</section>'
 +'<div class="family-actions"><a class="family-btn secondary" href="/admin">العودة للإدارة</a><a class="family-btn secondary" href="/family/manage">بوابة إدارة الأسرة</a></div></div>';
 return page('مشرفو الأفخاذ والعوائل', '<style>'+css+'</style>'+content,true);
}
export function familyMemberView(data,csrf,done){
 const inviteCards=data.invites.map(i=>'<div class="family-details"><strong>'+e(status[i.role_key])+'</strong><div class="family-slim">تنتهي الدعوة: '+e(date(i.expires_at))+'</div>'+form('/family/manage','accept',csrf,
  '<input type="hidden" name="invite" value="'+e(i.id)+'">','قبول الدعوة وربط الصلاحية')+'</div>').join('');
 const familyNames=data.families.map(f=>'<span class="family-pill">'+e(f.fakhth_name)+' / '+e(f.name)+'</span>').join('');
 const familySelection=select('العائلة المطلوبة','family',data.families,'id',x=>x.fakhth_name+' / '+x.name,true);
 const fakhthMap=[...new Map(data.families.map(x=>[x.fakhth_id,{id:x.fakhth_id,name:x.fakhth_name}])).values()];
 const fakhthSelection=select('الفخذ الذي تتبعه العائلة','fakhth',fakhthMap,'id',x=>x.name,true);
 const relatedOpts='<option value="">سجل شخص أولي (دون تحديد قريب)</option>'+data.anchors.filter(x=>x.id&&x.name).map(x=>'<option value="'+e(x.id)+'">'+e(x.name)+'</option>').join('');
 const relationOpts=Object.entries(relationshipLabels).filter(([key])=>!['child','grandchild_or_descendant'].includes(key)).map(([value,name])=>'<option value="'+e(value)+'">'+e(name)+'</option>').join('');
 const proposeFields=familySelection+fakhthSelection
 +'<label>الشخص المرتبط الذي تُضاف له زوجة أو ابن أو قرابة<select name="anchor">'+relatedOpts+'</select></label>'
 +'<label>نوع العلاقة<select name="relationship" required>'+relationOpts+'</select></label>'
 +'<label>الاسم الكامل<input name="full_name" required minlength="3" maxlength="200" placeholder="الاسم حسب المستندات"></label>'
 +'<label>الجنس<select name="gender"><option value="unknown">غير محدد</option><option value="male">ذكر</option><option value="female">أنثى</option><option value="undisclosed">غير معلن</option></select></label>'
 +'<label>تاريخ الميلاد (اختياري)<input type="date" name="birth_date"></label>'
 +'<label>اسم الأب في المستند (اختياري)<input name="father_name" maxlength="150"></label>'
 +'<label>اسم الأم في المستند (اختياري)<input name="mother_name" maxlength="150"></label>'
 +'<label>مكان الميلاد (اختياري)<input name="birthplace" maxlength="120"></label>'
 +'<label>الجنسية (اختياري)<input name="nationality" maxlength="80"></label>'
 +'<label>رقم/مرجع المستند دون تفاصيل حساسة<input name="record_reference" maxlength="200"></label>'
 +'<label>نوع الوثيقة (اختياري)<select name="identifier_type"><option value="">لا توجد وثيقة الآن</option><option value="national_id">هوية وطنية</option><option value="residency">إقامة</option><option value="passport">جواز سفر</option><option value="birth_certificate">شهادة ميلاد</option></select></label>'
 +'<label>رقم الوثيقة للمطابقة فقط (اختياري)<input name="identity_number" type="text" inputmode="numeric" maxlength="18" autocomplete="off" placeholder="يتحول لبصمة آمنة ولا يُحفظ الرقم الأصلي"></label>'
 +'<label>الملاحظات أو مصدر العلاقة<textarea name="notes" maxlength="1000" rows="3" placeholder="اذكر المستند أو مصدر صلة القرابة"></textarea></label>'
 +'<p class="family-callout family-warning">بعد الإرسال يظهر الطلب لدى الإدارة تلقائيًا. وجود رقم الهوية لا يمنح حق الاطلاع على بيانات شخص آخر.</p>';
 const requests=table(['الاسم','العلاقة','العائلة','الحالة','التاريخ'],data.pending.map(r=>row([e(r.proposed_name_ar),e(relationshipLabels[r.relationship]||r.relationship),e(r.family_name),pills(r.status),e(date(r.created_at))])));
 const relatives='<div>'+data.relatives.map(x=>'<div class="family-relation-item"><span class="family-relation-glyph">✦</span><div><strong>'+e(x.display_name||'اسم محجوب لحماية الخصوصية')+'</strong><div class="family-slim">'+e(relationshipLabels[x.relation_kind]||x.relation_kind)+(x.generation>1?' — الجيل '+fmt(x.generation):'')+'</div></div></div>').join('')+'</div>';
 const shareForm=data.ownVerified?form('/family/manage','share_name',csrf,
   '<label>بريد شخص تسمح له برؤية اسمك في الشجرة<input name="viewer_email" type="email" maxlength="254" placeholder="relative@example.com" required></label>'
   +'<p class="family-sub">لا تشمل الموافقة رقم الهوية أو المعلومات الخاصة؛ الاسم المعتمد فقط.</p>','إضافة موافقة اطلاع'):'<p class="family-sub">تُتاح مشاركة الاسم بعد توثيق سجل شخصك وربطه بحسابك.</p>';
 const sharedNames=table(['المسموح له','إلغاء'],(data.consents||[]).map(c=>row([e(c.email),
   form('/family/manage','revoke_name',csrf,'<input type="hidden" name="viewer" value="'+e(c.allowed_user_id)+'">','إلغاء الموافقة')])));
  const body='<div class="family-shell"><div class="family-breadcrumb"><a href="/dashboard">لوحة التحكم</a> / إدارة أسرتي</div>'
 +'<section class="family-banner"><h1>إدارة الأسرة والقرابة</h1><p>تظهر ذرية الأب والأم وأبناء الأبناء والبنات، مع بقاء الأبناء والبنات المتزوجين في تسلسل النسب المعتمد. البيانات الخاصة محمية بموافقات الاطلاع.</p></section>'
 +(done?'<div class="family-callout" role="status">تم حفظ الطلب وإرساله إلى الإدارة للمراجعة.</div>':'')
 +'<div class="family-grid"><section class="family-card"><h2>صلاحيات الإشراف الحالية</h2><div class="family-roles">'+data.grants.map(g=>'<span class="family-pill">'+e(status[g.role_key]||g.role_key)+'</span>').join('')+'</div><h3>العائلات المتاحة</h3><div class="family-pillrow">'+(familyNames||'<span class="family-sub">لم يُربط حسابك بفخذ أو عائلة بعد.</span>')+'</div><p class="family-sub">الصلاحيات لا تنتقل إلى عائلات أخرى تلقائيًا.</p></section>'
 +'<section class="family-card"><h2>دعوات المشرفين</h2>'+(inviteCards||'<div class="family-empty">لا توجد دعوات بانتظار القبول.</div>')+'<p class="family-sub">يجب أن يكون بريدك مؤكدًا لقبول أي دعوة.</p></section></div>'
 +'<div class="family-grid"><section class="family-card"><h2>إضافة زوجة أو ابن أو ابنة أو قريب</h2>'+(data.families.length?form('/family/manage','submit',csrf,proposeFields,'إرسال الطلب للمراجعة'):'<div class="family-empty">يجب منح نطاق إشراف وربطه بسجل العائلة قبل الإضافة.</div>')+'</section>'
 +'<section class="family-card"><h2>التسلسل العائلي الموثق</h2><p class="family-sub">الجد والجدة، العم والخال، الذرية المباشرة والأحفاد. العلاقات مشتقة من السجلات المعتمدة فقط.</p>'+(data.relatives.length?relatives:'<div class="family-empty">لا توجد روابط نسب موثّقة متاحة بعد. طلباتك المرسلة تظهر أدناه.</div>')+'</section></div>'
 +'<section class="family-card"><h2>موافقة مشاركة اسمي مع الأقارب</h2>'+shareForm+sharedNames+'</section>'
 +'<section class="family-card"><h2>طلباتي العائلية السابقة</h2>'+requests+'</section><div class="family-actions"><a href="/dashboard" class="family-btn secondary">لوحة التحكم</a></div></div>';
 return page('إدارة أسرتي', '<style>'+css+'</style>'+body,true);
}
