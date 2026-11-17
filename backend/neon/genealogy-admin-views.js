import { escapeHtml as esc } from './member-views.js';
import { genealogyStyles } from './genealogy-admin-style.js';
const e=x=>esc(x??'');
const n=x=>new Intl.NumberFormat('ar-SA').format(Number(x||0));
const h=(key,value)=>'<input type="hidden" name="'+e(key)+'" value="'+e(value)+'">';
const types={branch:'فرع',clan:'بطن',subclan:'فخذ',family:'عائلة',house:'بيت'};
const status={draft:'مسودة',under_review:'تحت المراجعة',verified:'معتمد',disputed:'متنازع عليه',archived:'مؤرشف',approved:'معتمد للنشر',needs_review:'بانتظار المراجعة'};
const gender={male:'ذكر',female:'أنثى',unknown:'غير معروف',undisclosed:'غير معلن'};
const options=(rows,valueKey,label,selected='',blank='— اختر من المسجّل —')=>
 '<option value="">'+e(blank)+'</option>'+rows.map(row=>'<option value="'+e(row[valueKey])+'"'+(row[valueKey]===selected?' selected':'')+'>'+e(label(row))+'</option>').join('');
const genderSelect=(selected='unknown')=>'<select name="gender">'+Object.entries(gender).map(([value,title])=>'<option value="'+value+'"'+(value===selected?' selected':'')+'>'+title+'</option>').join('')+'</select>';
const idKind=(name='identifier_type')=>'<select name="'+e(name)+'" aria-label="نوع الوثيقة"><option value="national_id">هوية وطنية</option><option value="residency">إقامة</option><option value="passport">جواز سفر</option><option value="birth_certificate">شهادة ميلاد</option></select>';
const form=(operation,csrf,body,label)=>
 '<form method="post" action="/admin/genealogy" class="gen-form">'+h('csrf',csrf)+h('operation',operation)+body+
 '<button class="gen-submit" type="submit">'+e(label)+'</button></form>';

function selectParents(data, role, selected=''){
 const opts=options(data.directory,'id',p=>p.full_name_ar+' — '+(gender[p.gender]||'')+' · '+(p.identity_mask||'بلا هوية'),selected);
 return '<select name="'+e(role)+'_id" aria-label="اختيار '+e(role)+'" >'+(selected?opts.replace('<option value="">','<option value="" disabled>'):opts)+'</select>';
}
function relative(data,role,label,genderAr){
 const auto=data.childOf && ((role==='father'&&data.childOf.gender==='male')||(role==='mother'&&data.childOf.gender==='female'))?data.childOf.id:'';
 const chooser=selectParents(data,role,auto);
 return '<details class="gen-details"'+(auto?' open':'')+'><summary>'+e(label)+' · '+e(genderAr)+' — اختر موجودًا أو أضف جديدًا</summary>'+
 '<div class="gen-relative"><label class="gen-wide">شخص موجود مسجل'+chooser+'</label>'+
 '<label class="gen-wide">الاسم الكامل عند إنشاء سجل جديد<input name="'+e(role)+'_name" maxlength="200" placeholder="اكتب الاسم الكامل كما في المستند" autocomplete="off"></label>'+
 '<label>نوع الوثيقة'+idKind(role+'_identity_kind')+'</label>'+
 '<label>رقم الهوية أو الوثيقة<input type="password" inputmode="numeric" autocomplete="off" name="'+e(role)+'_identity" maxlength="50" placeholder="اختياري ولا يُعرض بعد الحفظ"></label></div>'+
 '<small>إذا أدخلت هوية موجودة، يستلزم استخدامها موافقتك على إعادة ربط السجل المطابق، ولا يتم إنشاء نسخة أخرى.</small></details>';
}
function unitSelect(data,selected='',blank='— دون أصل / فرع مستقل —',units=null){
 return '<select name="parent_id">'+options(units||data.directoryUnits||data.units,'id',u=>u.name_ar+' · '+(types[u.unit_type]||u.unit_type),selected,blank)+'</select>';
}
function familySelect(data,selected='',name='person_family_id'){
 const all=data.directoryUnits||data.units, byId=new Map(all.map(item=>[item.id,item]));
 const fakhth=unit=>{
  let current=unit,depth=0;
  while(current&&depth++<12){if(current.unit_type==='subclan')return current.name_ar;current=byId.get(current.parent_id);}
  return '';
 };
 return '<select name="'+e(name)+'">'+options(all.filter(u=>['family','house'].includes(u.unit_type)),'id',u=>u.name_ar+(fakhth(u)?' · فخذ '+fakhth(u):''),selected,'— غير محدد —')+'</select>';
}
function tribeSelect(data,name='tribe_id',selected=''){
 const value=selected||data.tribes[0]?.id||'';
 return '<select name="'+e(name)+'" required>'+data.tribes.map(u=>'<option value="'+e(u.id)+'"'+(value===u.id?' selected':'')+'>'+e(u.name_ar)+'</option>').join('')+'</select>';
}
function creationExtras(){
 const work=[['','— غير محددة —'],['employed','موظف'],['self_employed','عمل حر'],['unemployed','غير موظف'],['student','طالب'],['retired','متقاعد']]
  .map(([v,title])=>'<option value="'+v+'">'+title+'</option>').join('');
 return '<details class="gen-details gen-create-extras"><summary>05 · تفاصيل الفرد الخاصة (اختياري · حفظ مباشر)</summary>'+
 '<p class="gen-muted">يمكن إدخال البيانات من الآن، وستحفظ مع الفرد في الملف الخاص المشفّر دون إظهارها في شجرة النسب العامة.</p>'+
 '<div class="gen-form-grid">'+
 input('phone','رقم الجوال','',32,'tel','autocomplete="off"')+
 input('email','البريد الإلكتروني','',254,'email','autocomplete="off"')+
 input('city','مدينة السكن','',100)+input('region','المنطقة','',100)+input('country','رمز الدولة','SA',2)+
 input('address_short_code','العنوان الوطني المختصر','',12)+
 input('address_building_number','رقم المبنى','',8,'text','inputmode="numeric"')+
 input('address_street','الشارع','',160)+input('address_district','الحي','',130)+
 input('address_postal_code','الرمز البريدي','',10,'text','inputmode="numeric"')+
 input('address_additional_number','الرقم الإضافي','',10,'text','inputmode="numeric"')+
 input('address_unit_number','رقم الوحدة','',20)+
 wide('<label>تفاصيل العنوان<textarea name="address_address_details" maxlength="750" rows="2"></textarea></label>')+
 '<label>الحالة الوظيفية<select name="employment_status">'+work+'</select></label>'+
 input('education_level','المؤهل العلمي','',120)+input('employer','جهة العمل','',200)+
 input('job_title','المسمى الوظيفي','',160)+
 '<label>حالة الحياة<select name="living_status"><option value="unknown">غير محددة</option><option value="alive">حي</option><option value="deceased">متوفى</option></select></label>'+
 '<label>تاريخ الوفاة (إن وجد)<input type="date" name="death_date"></label>'+
 wide('<label>نبذة تعريفية<textarea name="biography" maxlength="4000" rows="3"></textarea></label>')+
 wide('<label>ملاحظات داخلية مشفرة<textarea name="private_notes" maxlength="5000" rows="5"></textarea></label>')+
 '</div></details>';
}
function personWizard(data,csrf){
 const fields='<div class="gen-bundle"><fieldset><legend>01 · الفرد الجديد</legend>'+
 '<div class="gen-form-grid"><label>الاسم الكامل *<input name="person_name" maxlength="200" minlength="3" required placeholder="الاسم الأول واسم الأب والجد"></label>'+
 '<label>الجنس<select name="person_gender"><option value="male">ذكر</option><option value="female">أنثى</option><option value="unknown">غير معروف</option></select></label>'+
 '<label>القبيلة / السجل'+tribeSelect(data)+'</label>'+
 '<label>العائلة / البيت'+familySelect(data)+'</label>'+
 '<label>نوع الوثيقة'+idKind('person_identity_kind')+'</label>'+
 '<label>هوية الشخص (اختياري)<input type="password" inputmode="numeric" name="person_identity" autocomplete="off" maxlength="50" placeholder="لا تُعرض أو تحفظ بصيغتها الخام"></label>'+'<label>تاريخ الميلاد (اختياري)<input type="date" name="person_birth_date"></label>'+'<label>مكان الميلاد (اختياري)<input name="person_birth_place" maxlength="120"></label></div></fieldset>'+
 '<fieldset><legend>02 · الأب والأم</legend><div class="gen-step-notice">اختر شخصًا موجودًا من القائمة أو افتح البطاقة لإضافة الأب والأم بالاسم والهوية. يمكن إضافة الابن حتى لو لم تتوفر سجلات الأجداد كاملة.</div>'+
 relative(data,'father','الأب','ذكر')+relative(data,'mother','الأم','أنثى')+'</fieldset>'+
 '<fieldset><legend>03 · الأجداد من جهة الأب</legend>'+
 relative(data,'father_father','جد الأب','ذكر')+relative(data,'father_mother','جدة الأب','أنثى')+'</fieldset>'+
 '<fieldset><legend>04 · الأجداد من جهة الأم</legend>'+
 relative(data,'mother_father','جد الأم','ذكر')+relative(data,'mother_mother','جدة الأم','أنثى')+'</fieldset>'+creationExtras()+
 '<div class="gen-note">جميع الأشخاص الجدد سجلات <b>خاصة وقيد المراجعة</b>. قد يُنشأ حتى ٧ أفراد في عملية واحدة؛ ولا يُنشر أي نسب في الدليل العام تلقائيًا.</div>'+
 '<label class="gen-check"><input name="confirm_reuse" type="checkbox" value="yes">أوافق على استخدام سجل موجود إذا تطابقت بصمة الهوية وراجعت اسم الشخص.</label>'+
 '<label class="gen-check"><input name="allow_duplicate_name" type="checkbox" value="yes">أتفهم وجود أسماء متشابهة وأوافق على إنشاء شخص مختلف بعد التحقق.</label></div>';
 return form('create_tree',csrf,fields,'حفظ الفرد وشجرة أصوله');
}
function peoplePagination(data){
 const page=data.peoplePage||1;
 if(page===1&&!data.hasMorePeople)return '';
 const url=number=>'/admin/genealogy?'+new URLSearchParams({
  q:data.q||'',unit_q:data.unitQ||'',people_page:String(number),
 })+'#gen-people';
 return '<nav class="gen-pagination" aria-label="صفحات سجل الأفراد">'+
   (page>1?'<a class="gen-compact-button" rel="prev" href="'+e(url(page-1))+'">السابقة</a>':'')+
   '<span>الصفحة '+n(page)+'</span>'+
   (data.hasMorePeople?'<a class="gen-compact-button" rel="next" href="'+e(url(page+1))+'">التالية</a>':'')+
   '</nav>';
}
function personRows(data){
 if(!data.people.length)return '<p class="gen-muted">لا توجد نتائج مطابقة. ابحث باسم آخر أو أضف فردًا جديدًا.</p>';
 return '<div class="gen-scroll"><table class="gen-table"><thead><tr><th>الشخص</th><th>العائلة والأصول</th><th>الحالة</th><th>الإدارة</th></tr></thead><tbody>'+
 data.people.map(p=>{
  const father=p.father_name||'—';
  const mother=p.mother_name||'—';
  const url='/admin/genealogy?person_id='+encodeURIComponent(p.id)+'#gen-person-edit';
  return '<tr><td><strong>'+e(p.full_name_ar)+'</strong><br><small class="gen-small">'+e(gender[p.gender]||'')+' · '+e(p.identity_mask||'لا توجد هوية')+'</small></td>'+
    '<td>'+e(p.family_name||'عائلة غير محددة')+'<br><small class="gen-small">الأب: '+e(father)+'<br>الأم: '+e(mother)+'</small></td>'+
    '<td><span class="gen-pill">'+e(status[p.record_status]||p.record_status)+'</span></td>'+
    '<td>'+ (data.canEditPeople?'<div class="gen-action-group"><a class="gen-compact-button" href="'+e(url)+'">تعديل</a>'+
    '<a class="gen-compact-button" href="/admin/genealogy?child_of='+encodeURIComponent(p.id)+'#gen-tree-create">إضافة ابن/ابنة</a></div>':'—')+'</td></tr>';
 }).join('')+'</tbody></table></div>';
}
const dateValue=value=>{
 if(!value)return '';
 const date=new Date(value);
 return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10);
};
const input=(name,title,value='',max=160,type='text',other='')=>
 '<label>'+e(title)+'<input name="'+e(name)+'" type="'+e(type)+'" maxlength="'+max+'" value="'+e(value??'')+'" '+other+'></label>';
const wide=(html)=>'<div class="gen-full">'+html+'</div>';

const relationRoles={
 spouse:'زوج / زوجة',child:'ابن / ابنة',father:'الأب',mother:'الأم',
 father_father:'الجد من الأب',father_mother:'الجدة من الأب',
 mother_father:'الجد من الأم',mother_mother:'الجدة من الأم'
};
const marriageLabels={reported:'زواج مُبلّغ عنه · ينتظر التوثيق',current:'زواج قائم',ended:'زواج منتهٍ',disputed:'زواج يحتاج مراجعة',void:'علاقة ملغاة'};
const editLink=p=>'/admin/genealogy?person_id='+encodeURIComponent(p.id)+'#gen-person-edit';
function personLink(p,extra=''){
 if(!p)return '<span class="gen-rel-unknown">غير مسجّل</span>';
 return '<article class="gen-relation-person"><div><strong>'+e(p.full_name_ar)+'</strong><small>'+
 e(p.family_name||'العائلة غير محددة')+' · '+e(status[p.record_status]||p.record_status||'تحت المراجعة')+
 (extra?' · '+e(extra):'')+'</small></div>'+
 '<a href="'+e(editLink(p))+'" class="gen-compact-button">عرض وتعديل السجل</a></article>';
}
function relationEditor(data,csrf){
 const p=data.focusedPerson;if(!p||!data.canEditPeople)return '';
 const relations=data.relations||{ancestors:[],spouses:[],children:[]};
 const byId=new Map(relations.ancestors.map(r=>[r.id,r]));
 const father=byId.get(p.father_id),mother=byId.get(p.mother_id);
 const isMarried=relations.spouses.some(s=>['reported','current','disputed'].includes(s.marriage_status));
 const familyGroup=(title,records)=>'<div class="gen-rel-group"><h4>'+e(title)+'</h4>'+records.map(x=>personLink(x)).join('')+'</div>';
 const ancestors='<div class="gen-rel-grid">'+
 familyGroup('الأب والأم',[father,mother])+
 familyGroup('أجداد الأب',[father&&byId.get(father.father_id),father&&byId.get(father.mother_id)])+
 familyGroup('أجداد الأم',[mother&&byId.get(mother.father_id),mother&&byId.get(mother.mother_id)])+'</div>';
 const spouses=relations.spouses.length?relations.spouses.map(x=>personLink(x,marriageLabels[x.marriage_status]||x.marriage_status)).join(''):
 '<p class="gen-muted">لا توجد علاقة زواج مسجلة في الداتا حتى الآن.</p>';
 const children=relations.children.length?relations.children.map(x=>personLink(x,e(x.gender==='male'?'ابن':x.gender==='female'?'ابنة':'فرد'))).join(''):
 '<p class="gen-muted">لا يوجد أبناء مسجلون تحت هذا الشخص.</p>';
 const roles=Object.entries(relationRoles).map(([key,label])=>'<option value="'+key+'">'+e(label)+'</option>').join('');
 const genderOpts='<option value="unknown">غير محدد</option><option value="male">ذكر</option><option value="female">أنثى</option>';
 const add=form('add_relation',csrf,
  h('person_id',p.id)+
  '<div class="gen-form-grid">'+
  '<label>صلة القرابة المطلوب إضافتها *<select name="relation_role" required>'+roles+'</select></label>'+
  '<label>شخص موجود في سجلات الديوان'+
   '<select name="relative_id" aria-label="اختيار قريب موجود">'+options(data.directory,'id',r=>r.full_name_ar+' · '+(r.identity_mask||'بلا هوية'),'','— ابحث بالاسم في القائمة أو أدخل الهوية —')+'</select></label>'+
  wide('<p class="gen-muted">إن كانت الهوية مسجلة، يجري فحص بصمتها تلقائيًا عند الحفظ، وتُستخدم بيانات السجل الموجود بدل إنشاء مكرر بعد تأكيدك. وإذا كانت غير موجودة، يُنشأ ملف خاص للقريب مع علاقة تحت المراجعة.</p>')+
  input('relative_name','الاسم الكامل للقريب (عند عدم اختيار سجل سابق)','',200,'text','autocomplete="off"')+
  '<label>جنس القريب الجديد<select name="relative_gender">'+genderOpts+'</select></label>'+
  '<label>نوع الهوية'+idKind('relative_identity_kind')+'</label>'+
  input('relative_identity','رقم الهوية أو الوثيقة','',50,'password','inputmode="numeric" autocomplete="off" placeholder="يستخدم للمطابقة أولًا"')+
  '<label>العائلة / البيت للقريب'+familySelect(data,'','relative_family_id')+'</label>'+
  '<label>الزوج/الزوجة الآخر كوالد للابن (اختياري)<select name="co_parent_id">'+options(relations.spouses.filter(x=>['current','reported'].includes(x.marriage_status)),'id',x=>x.full_name_ar+' — '+(marriageLabels[x.marriage_status]||''),'','— بلا والد ثانٍ —')+'</select></label>'+
  '<label>تاريخ الميلاد<input type="date" name="relative_birth_date"></label>'+
  input('relative_birth_place','مكان الميلاد','',120)+
  '<label>حالة الحياة<select name="relative_living_status"><option value="unknown">غير معروف</option><option value="alive">حي</option><option value="deceased">متوفى</option></select></label>'+
  wide('<label class="gen-check"><input type="checkbox" name="confirm_reuse" value="yes">أوافق على ربط سجل مسجل مسبقًا عند تطابق رقم هويته واسمه</label>')+
  '</div>'+
  '<details class="gen-details"><summary>تفاصيل إضافية للقريب الجديد · اختياري</summary><div class="gen-form-grid">'+
   input('relative_phone','الجوال','',32,'tel')+
   input('relative_email','البريد الإلكتروني','',254,'email')+
   input('relative_city','مدينة السكن','',100)+input('relative_region','المنطقة','',100)+
   input('relative_country','رمز الدولة','SA',2)+
   input('relative_address_short_code','العنوان المختصر','',12)+
   input('relative_address_street','الشارع','',160)+
   input('relative_address_district','الحي','',130)+
   input('relative_address_building_number','رقم المبنى','',8,'text','inputmode="numeric"')+
   input('relative_address_postal_code','الرمز البريدي','',10,'text','inputmode="numeric"')+
   input('relative_address_additional_number','الرقم الإضافي','',10,'text','inputmode="numeric"')+
   input('relative_address_unit_number','رقم الوحدة','',20)+
   input('relative_education_level','المؤهل العلمي','',120)+
   input('relative_employer','جهة العمل','',200)+
   input('relative_job_title','المسمى الوظيفي','',160)+
   '<label>الحالة الوظيفية<select name="relative_employment_status"><option value="">— غير محدد —</option><option value="employed">موظف</option><option value="retired">متقاعد</option><option value="student">طالب</option><option value="self_employed">عمل حر</option><option value="unemployed">غير موظف</option></select></label>'+
   wide('<label>تفاصيل إضافية عن العنوان<textarea name="relative_address_address_details" maxlength="750" rows="2"></textarea></label>')+
   wide('<label>ملاحظات خاصة<textarea name="relative_private_notes" maxlength="5000" rows="4"></textarea></label>')+
   '</div></details>'+
   '<p class="gen-muted">للأب والأجداد الذكور من جهة النسب الأبوي، يمكن اقتراح العائلة المسجلة تلقائيًا عند عدم اختيار عائلة أخرى. الأم والزوجة وعائلاتهن لا تُستنتج من اسم الزوج.</p>',
   'فحص الهوية وحفظ صلة القرابة');
 const currentMarriage=isMarried?'<div class="gen-rel-tabs"><h3>الزوجات / الأزواج المسجلون</h3>'+spouses+'<h3>الأبناء والبنات</h3>'+children+'</div>':
 '<div class="gen-rel-tabs"><h3>الأب والأم والأجداد</h3>'+ancestors+'</div>';
 const secondary=isMarried?'<details class="gen-details gen-rel-ancestors"><summary>عرض الأب والأم وأجداد الطرفين</summary>'+ancestors+'</details>':
 relations.children.length?'<details class="gen-details"><summary>الأبناء الموجودون في السجل</summary>'+children+'</details>':'';
 return '<section class="gen-relation-panel"><div class="gen-section-head"><div><h3>العائلة والأصول والنسل</h3>'+
 '<small>'+(isMarried?'تُعرض الزيجات والأبناء المرتبطون بهذا السجل':'لا توجد زيجات مسجلة · يُعرض تسلسل الأب والأم والأجداد')+'</small></div>'+
 '<span class="gen-pill">'+e(relations.children.length)+' أبناء · '+e(relations.spouses.length)+' زواج</span></div>'+
 currentMarriage+secondary+
 '<details class="gen-details gen-relation-add"><summary>＋ إضافة زوج / ابن / أب / أم / جد أو جدة وربطه بالهوية</summary>'+
 add+'</details></section>';
}
function editPersonCard(data,csrf){
 const p=data.focusedPerson;
 if(!p||!data.canEditPeople)return '';
 const ad=p.private_address||{};
 const selected=(v,current)=>v===current?' selected':'';
 const addressRows=[
   input('address_short_code','العنوان المختصر',ad.short_code,12,'text','placeholder="مثال: RRRD1234"'),
   input('address_building_number','رقم المبنى',ad.building_number,8,'text','inputmode="numeric" placeholder="٤ أرقام"'),
   input('address_street','الشارع',ad.street,160),
   input('address_district','الحي',ad.district,130),
   input('address_postal_code','الرمز البريدي',ad.postal_code,10,'text','inputmode="numeric" placeholder="٥ أرقام"'),
   input('address_additional_number','الرقم الإضافي',ad.additional_number,10,'text','inputmode="numeric" placeholder="٤ أرقام"'),
   input('address_unit_number','رقم الوحدة',ad.unit_number,20),
   wide('<label>وصف تفصيلي للعنوان<textarea name="address_address_details" maxlength="750" rows="3">'+e(ad.address_details||'')+'</textarea></label>')
 ].join('');
 const employment=[
  ['','— غير محددة —'],['employed','موظف'],['self_employed','عمل حر'],['unemployed','غير موظف'],['student','طالب'],['retired','متقاعد'],['unknown','غير معروف']
 ].map(([v,l])=>'<option value="'+v+'"'+selected(v,p.employment_status||'')+'>'+l+'</option>').join('');
 const editor=h('id',p.id)+
  '<fieldset class="gen-edit-fieldset"><legend>01 · البيانات الأساسية والنسب</legend><div class="gen-form-grid">'+
  wide(input('full_name','الاسم الكامل',p.full_name_ar,200,'text','required'))+
  '<label>الجنس'+genderSelect(p.gender)+'</label>'+
  '<label>العائلة / البيت'+familySelect(data,p.family_unit_id,'family_id')+'</label>'+
  '<label>الأب'+selectParents(data,'father',p.father_id)+'</label>'+
  '<label>الأم'+selectParents(data,'mother',p.mother_id)+'</label>'+
  '</div><p class="gen-muted">يمكن إضافة أب أو أم غير مسجلين. تغيير الوالدين المرتبطين مسبقًا يتم عبر طلب تصحيح موثق لحماية تسلسل الأنساب.</p></fieldset>'+
  '<fieldset class="gen-edit-fieldset"><legend>02 · الميلاد والحالة والنبذة</legend><div class="gen-form-grid">'+
  input('birth_place','مكان الميلاد',p.birth_place,120)+
  '<label>تاريخ الميلاد<input name="birth_date" type="date" value="'+e(dateValue(p.birth_date))+'"></label>'+
  '<label>حالة الحياة<select name="living_status"><option value="unknown"'+selected('unknown',p.living_status)+'>غير معروفة</option><option value="alive"'+selected('alive',p.living_status)+'>حي</option><option value="deceased"'+selected('deceased',p.living_status)+'>متوفى</option></select></label>'+
  '<label>تاريخ الوفاة (إن وجد)<input type="date" name="death_date" value="'+e(dateValue(p.death_date))+'"></label>'+
  wide('<label>نبذة تعريفية (تخضع للمراجعة قبل إتاحتها)<textarea name="biography" maxlength="4000" rows="4">'+e(p.biography||'')+'</textarea></label>')+
  '</div></fieldset>'+
  '<fieldset class="gen-edit-fieldset"><legend>03 · الهوية والوثائق الحساسة</legend><div class="gen-form-grid">'+
  wide('<p class="gen-sensitive">الهوية المسجلة: <strong dir="ltr">'+e(p.national_id_last4?'••••••'+p.national_id_last4:'غير موجودة في الملف الخاص')+'</strong>. لن يظهر الرقم الكامل بعد الحفظ، ويمكن استبدال الهوية غير المعتمدة برقم صحيح.</p>')+
  '<label>نوع الوثيقة'+idKind()+'</label>'+
  input('identity','تسجيل أو استبدال رقم الهوية','',50,'password','autocomplete="new-password" inputmode="numeric" placeholder="اتركه فارغًا للمحافظة على الحالي"')+
  wide('<label class="gen-check"><input type="checkbox" name="remove_identity" value="yes">إلغاء الهوية غير المعتمدة وحذف نسختها المشفّرة من الملف (اترك الرقم الجديد فارغًا)</label>')+
  '</div></fieldset>'+
  '<fieldset class="gen-edit-fieldset"><legend>04 · العنوان الوطني والسكن</legend><div class="gen-form-grid">'+
  input('city','المدينة',p.city,100)+input('region','المنطقة',p.region,100)+
  input('country','رمز الدولة',p.country||'SA',2,'text','placeholder="SA"')+
  addressRows+'</div><p class="gen-muted">تفاصيل المبنى والشارع والحي والرمز البريدي والعنوان المختصر مشفّرة في قاعدة البيانات.</p></fieldset>'+
  '<fieldset class="gen-edit-fieldset"><legend>05 · التواصل والعمل والتعليم</legend><div class="gen-form-grid">'+
  input('phone','رقم الجوال',p.phone,32,'tel','autocomplete="off"')+
  input('email','البريد الإلكتروني',p.email,254,'email','autocomplete="off"')+
  '<label>الحالة الوظيفية<select name="employment_status">'+employment+'</select></label>'+
  input('education_level','المؤهل العلمي',p.education_level,120)+
  input('employer','جهة العمل',p.employer,200)+
  input('job_title','المسمى الوظيفي',p.job_title,160)+
  '</div></fieldset>'+
  '<fieldset class="gen-edit-fieldset"><legend>06 · التفاصيل الطويلة الخاصة</legend>'+
  '<p class="gen-muted">ملاحظات لا تُعرض للزوار أو في الشجرة العامة؛ محمية بالتشفير وصلاحيات الإدارة.</p>'+
  '<label>الملاحظات الداخلية الكاملة<textarea name="private_notes" maxlength="5000" rows="7" placeholder="توثيق خاص، بيانات إضافية، تواريخ وتفاصيل تحتاج الحفظ...">'+e(p.private_notes||'')+'</textarea></label>'+
  '</fieldset><p class="gen-muted">حفظ التعديل يعيد السجل للمراجعة، ويحفظ المحتوى الخاص منفصلًا عن النبذة العامة.</p>';
 const edit=form('edit_person',csrf,editor,'حفظ جميع بيانات الفرد');
 const archive=form(p.record_status==='archived'?'restore_person':'archive_person',csrf,h('id',p.id)+
  '<label class="gen-check"><input type="checkbox" name="confirm" value="yes" required>أؤكد '+(p.record_status==='archived'?'استعادة':'أرشفة')+' سجل الفرد</label>',
  p.record_status==='archived'?'استعادة للمراجعة':'أرشفة السجل');
 const remove=form('delete_person_draft',csrf,h('id',p.id)+
  '<p class="gen-muted">الحذف الدائم مقيد بالمسودات غير المرتبطة بأبناء أو زوجات أو عضويات أو اعتماد رسمي.</p>'+
  '<label class="gen-check"><input type="checkbox" name="confirm" value="delete" required>أؤكد حذف المسودة غير المرتبطة</label>',
  'حذف المسودة');
 return '<section class="gen-section gen-editor" id="gen-person-edit">'+
  '<div class="gen-section-head"><div><span class="gen-editor-eyebrow">السجل الشخصي · تفاصيل الإدارة</span><h2>تعديل سجل: '+e(p.full_name_ar)+'</h2>'+
  '<small>محرر متكامل لفرد واحد للحفاظ على الأداء · البيانات الحساسة خاصة ومشفّرة</small></div>'+
  '<a href="/admin/genealogy" class="gen-compact-button">إغلاق المحرر</a></div>'+
  '<div class="gen-editor-layout"><div class="gen-editor-main">'+relationEditor(data,csrf)+edit+'</div>'+
  '<aside class="gen-editor-side"><div class="gen-side-panel"><h3>حالة السجل</h3><span class="gen-pill">'+e(status[p.record_status]||p.record_status)+'</span>'+
  '<p class="gen-muted">ترتبط بيانات الأنساب بمراجعة موثقة. لا يؤدي تغيير البيانات الخاصة إلى نشرها للعامة.</p></div>'+
  '<details class="gen-details"><summary>أرشفة / استعادة السجل</summary>'+archive+'</details>'+
  '<details class="gen-details gen-danger"><summary>حذف المسودة (إن لم تكن مرتبطة)</summary>'+remove+'</details></aside></div></section>';
}
function unitRows(data){
 const visible=data.units.slice(0,450);
 if(!visible.length)return '<p class="gen-muted">لا توجد وحدات نسب في هذا البحث.</p>';
 return '<div class="gen-scroll"><table class="gen-table"><thead><tr><th>وحدة النسب</th><th>النوع</th><th>حالة النشر</th><th>الإدارة</th></tr></thead><tbody>'+
 visible.map(unit=>{
  const url='/admin/genealogy?unit_id='+encodeURIComponent(unit.id)+'#gen-unit-edit';
  return '<tr><td>'+e(unit.name_ar)+'</td><td>'+e(types[unit.unit_type]||unit.unit_type)+'</td>'+
   '<td><span class="gen-pill">'+e(status[unit.review_status]||unit.review_status||'بلا مراجعة')+'</span></td>'+
   '<td><a class="gen-compact-button" href="'+e(url)+'">فتح محرر الوحدة</a></td></tr>';
 }).join('')+'</tbody></table></div>';
}
function editUnitCard(data,csrf){
 const unit=data.focusedUnit;
 if(!unit||!data.canEditUnits)return '';
 const update=form('edit_unit',csrf,h('id',unit.id)+
   '<label>اسم الوحدة<input name="name" maxlength="150" value="'+e(unit.name_ar)+'" required></label>'+
   '<label>الأصل'+unitSelect(data,unit.parent_id,'— دون أصل —',data.directoryUnits)+'</label>'+
   '<p class="gen-muted">يعود كل تعديل إلى قائمة المراجعة. نقل وحدة تحتوي أبناء غير مسموح مباشرة.</p>',
   'حفظ تعديل الوحدة');
 const withdraw=form('withdraw_unit',csrf,h('id',unit.id)+
   '<label class="gen-check"><input type="checkbox" name="confirm" value="yes" required>أؤكد إيقاف عرض هذه الوحدة حتى اكتمال المراجعة</label>','إيقاف النشر');
 const remove=form('delete_unit_draft',csrf,h('id',unit.id)+
   '<p class="gen-muted">الحذف متاح للسجلات اليدوية الجديدة غير المعتمدة والخالية من أي روابط.</p>'+
   '<label class="gen-check"><input type="checkbox" name="confirm" value="delete" required>تأكيد حذف وحدة مسودة</label>','حذف المسودة');
 return '<section class="gen-section" id="gen-unit-edit"><div class="gen-section-head"><div><h2>تعديل وحدة النسب: '+e(unit.name_ar)+'</h2><small>تعديل المسمى والتسلسل مع سجل تدقيق</small></div>'+
   '<a class="gen-compact-button" href="/admin/genealogy">إغلاق المحرر</a></div>'+
   '<div class="gen-form-grid"><div>'+update+'</div><div class="gen-bundle">'+
   '<details class="gen-details"><summary>إيقاف النشر للمراجعة</summary>'+withdraw+'</details>'+
   '<details class="gen-details"><summary>حذف مسودة الوحدة</summary>'+remove+'</details></div></div></section>';
}
export function genealogyView(data,csrf){
 const metrics=[
  ['الأفراد',data.stats.people],['الفروع والعائلات',data.stats.units],
  ['مسودات الأفراد',data.stats.drafts],['وحدات قيد المراجعة',data.stats.unit_reviews],
 ].map(([label,value])=>'<article><small>'+e(label)+'</small><strong>'+n(value)+'</strong></article>').join('');
 const shortcuts='<nav class="gen-services" aria-label="خدمات سجل الأنساب">'+
   '<a class="gen-compact-button" href="#gen-people">سجل الأفراد</a>'+
   (data.canEditPeople?'<a class="gen-submit" href="#gen-tree-create">إضافة فرد</a>':'')+
   '<a class="gen-compact-button" href="#gen-identity">البحث بالهوية</a>'+
   '<a class="gen-compact-button" href="#gen-units">الفروع والعائلات</a></nav>';
 const identityBox=data.lookup?'<div class="gen-result" role="status">'+
   (data.lookup.matched?'الهوية مسجلة باسم: '+e(data.lookup.record.full_name_ar)+' • '+e(data.lookup.record.masked_value||'رقم مقنّع')+' • الحالة: '+e(status[data.lookup.record.record_status]||data.lookup.record.record_status)+(data.canEditPeople?' <a href="/admin/genealogy?person_id='+encodeURIComponent(data.lookup.record.id)+'#gen-person-edit">فتح سجل الفرد</a>':''):
   'لا يوجد تطابق لهذه الهوية في الفهرس الحالي. يمكن إضافة الشخص كمراجعة جديدة.')+
  '</div>':'';
 const identitySearch=form('lookup_identity',csrf,
  '<div class="gen-form-grid"><label>نوع الهوية'+idKind()+'</label>'+
  '<label>الرقم المطلوب مطابقته<input name="identity" type="password" inputmode="numeric" autocomplete="off" maxlength="50" required placeholder="لا تظهر الهوية في الرابط أو نتائج البحث"></label></div>',
  'فحص وجود الهوية');
 const unitForm=form('create_unit',csrf,
  '<div class="gen-form-grid"><label>القبيلة'+tribeSelect(data)+'</label>'+
  '<label>النوع<select name="unit_type"><option value="branch">فرع</option><option value="clan">بطن</option><option value="subclan">فخذ</option><option value="family">عائلة</option><option value="house">بيت</option></select></label>'+
  '<label>الاسم<input name="name" required maxlength="150" placeholder="اسم الفخذ أو العائلة"></label>'+
  '<label>تابع إلى'+unitSelect(data)+'</label>'+
  '<label class="gen-wide">مصدر التوثيق<select name="source_id" required>'+options(data.sources,'id',s=>s.title+' · '+s.source_type,'','— اختر مصدرًا —')+'</select></label></div>'+
  '<p class="gen-muted">الفخذ يحتاج أصلًا من الفروع، والعائلة تحتاج فخذًا. السجلات الجديدة لا تُنشر قبل اعتمادها.</p>', 'إضافة الفخذ أو العائلة');
 return '<style>'+genealogyStyles+'</style><div class="gen-shell">'+
  shortcuts+'<div class="gen-summary">'+metrics+'</div>'+editPersonCard(data,csrf)+
  '<section class="gen-section" id="gen-identity"><div class="gen-section-head"><div class="gen-section-header"><div><h2>البحث عن هوية مسجلة</h2><small>كشف التطابق دون إظهار الرقم الأصلي أو إضافته إلى عنوان الصفحة</small></div></div></div>'+
    '<p class="gen-note">يتطلب البحث الرقم الكامل. يظهر الرقم مقنّعًا في النتيجة.</p>'+identityBox+identitySearch+'</section>'+
  (data.canEditPeople?'<section class="gen-section" id="gen-tree-create"><div class="gen-section-head"><div class="gen-section-header"><div><h2>إضافة فرد ونسبه الكامل</h2><small>الفرد ← الأب والأم ← الجد والجدة من الجهتين</small></div></div></div>'+
   (data.childOf?'<div class="gen-result">إضافة نسل جديد للسجل: '+e(data.childOf.full_name_ar)+' — تم اختيار '+e(data.childOf.gender==='female'?'الأم':'الأب')+' تلقائيًا، ويمكن تعديله.</div>':'')+personWizard(data,csrf)+'</section>':'<div class="gen-note">تحتاج إذن تعديل الهويات لإضافة الأفراد وتعديلهم.</div>')+
  '<section class="gen-section" id="gen-people"><div class="gen-section-head"><div><h2>سجل الأفراد</h2></div></div>'+
   '<form method="get" action="/admin/genealogy#gen-people" class="gen-search"><label>اسم الفرد<input type="search" maxlength="70" name="q" value="'+e(data.q)+'" placeholder="ابحث عن اسم أو لقب"></label>'+h('unit_q',data.unitQ)+
    '<button type="submit">بحث</button><a class="gen-compact-button" href="/admin/genealogy?unit_q='+encodeURIComponent(data.unitQ||'')+'#gen-people">مسح</a></form>'+
   personRows(data)+peoplePagination(data)+'</section>'+
  '<section class="gen-section" id="gen-units"><div class="gen-section-head"><div class="gen-section-header"><div><h2>إدارة الأفخاذ والعوائل</h2><small>إضافة وتعديل وربط الوحدات بالترتيب الأبوي الصحيح</small></div></div>'+
   '<a class="gen-compact-button" href="https://youef.github.io/alhazmi/ar/lineage/" target="_blank" rel="noopener noreferrer">معاينة الدليل العام</a></div>'+
   (data.canEditUnits?'<details class="gen-details"><summary>＋ إضافة فخذ أو عائلة أو بيت جديد</summary>'+unitForm+'</details>':'<p class="gen-muted">إنشاء الوحدات يحتاج صلاحية إدارة هيكلة النسب.</p>')+
   '<form method="get" action="/admin/genealogy#gen-units" class="gen-search">'+h('q',data.q)+'<label>اسم الفخذ أو العائلة<input name="unit_q" type="search" maxlength="70" value="'+e(data.unitQ)+'" placeholder="تصفية وحدات النسب"></label><button type="submit">تصفية</button></form>'+
   unitRows(data)+'</section>'+editUnitCard(data,csrf)+'</div>';
}
