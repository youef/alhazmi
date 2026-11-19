import { escapeHtml as esc } from './member-views.js';
import { genealogyStyles } from './genealogy-admin-style.js';
const e=x=>esc(x??'');
const n=x=>new Intl.NumberFormat('ar-SA').format(Number(x||0));
const genealogyPath='/admin/genealogy';
const panels={people:'سجل الأفراد',create:'إضافة فرد',identity:'مطابقة الهوية',units:'الفروع والعائلات',sources:'مصادر التوثيق'};
const panelLink=key=>genealogyPath+(key==='people'?'':'?view='+key);
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

function lookupFields(prefix,idName,title,person){
 const id=person?.id||'';
 return '<div class="gen-lookup gen-wide" data-relative-lookup data-initial-id="'+e(id)+'">'+
  '<strong>'+e(title)+'</strong>'+h(idName,id)+
  '<div class="gen-lookup-fields"><label>نوع الوثيقة'+idKind(prefix+'_identity_kind')+'</label>'+
  '<label>رقم الهوية أو الوثيقة<input type="password" inputmode="numeric" autocomplete="off" name="'+e(prefix)+'_identity" maxlength="50"></label>'+
  '<button class="gen-compact-button" type="button" data-lookup-submit>بحث بالهوية</button></div>'+
  '<p class="gen-muted" data-lookup-result aria-live="polite">'+(id?'السجل المرتبط: '+e(person.full_name_ar):'')+'</p></div>';
}
function relative(data,role,label,genderAr){
 const auto=data.childOf&&((role==='father'&&data.childOf.gender==='male')||(role==='mother'&&data.childOf.gender==='female'))?data.childOf:null;
 return '<details class="gen-details"'+(auto?' open':'')+'><summary>'+e(label)+' · '+e(genderAr)+'</summary>'+
 '<div class="gen-form-grid">'+lookupFields(role,role+'_id','مطابقة شخص مسجّل',auto)+
 '<label class="gen-wide">الاسم الكامل عند عدم العثور على سجل<input name="'+e(role)+'_name" maxlength="200" autocomplete="off"></label>'+
 familySelect(data,'',role+'_family_id')+'</div></details>';
}
function unitSelect(data,selected='',blank='— دون أصل / فرع مستقل —',units=null){
 return '<select name="parent_id">'+options(units||data.directoryUnits||data.units,'id',u=>u.name_ar+' · '+(types[u.unit_type]||u.unit_type),selected,blank)+'</select>';
}
function familySelect(data,selected='',name='person_family_id'){
 const all=data.directoryUnits||data.units;
 const byId=new Map(all.map(item=>[item.id,item]));
 const ancestry=unit=>{
  const seen=new Set();
  for(let item=unit;item&&!seen.has(item.id);item=byId.get(item.parent_id)){
   if(item.fakhth_unit_id)return item.fakhth_unit_id;
   if(item.registered_fakhth||item.unit_type==='subclan')return item.id;
   seen.add(item.id);
  }
  return '';
 };
 const families=all.filter(unit=>['family','house'].includes(unit.unit_type));
 const selectedFakhth=ancestry(byId.get(selected));
 const fakhths=all.filter(item=>item.registered_fakhth||item.unit_type==='subclan');
 return '<div class="gen-family-select gen-full" data-family-picker>'+
  '<label>الفخذ<select data-fakhth><option value="">اختر الفخذ</option>'+
  fakhths.map(unit=>'<option value="'+e(unit.id)+'" data-tribe="'+e(unit.tribe_id)+'"'+(unit.id===selectedFakhth?' selected':'')+'>'+e(unit.name_ar)+'</option>').join('')+
  '</select></label><label data-family-label>العائلة / البيت<select name="'+e(name)+'" data-family>'+
  '<option value="">— غير محدد —</option>'+
  families.map(unit=>'<option value="'+e(unit.id)+'" data-fakhth="'+e(ancestry(unit))+'" data-tribe="'+e(unit.tribe_id)+'"'+(unit.id===selected?' selected':'')+'>'+e(unit.name_ar)+'</option>').join('')+
  '</select></label></div>';
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
 dateInput('death_date','تاريخ الوفاة','','')+
 wide('<label>نبذة تعريفية<textarea name="biography" maxlength="4000" rows="3"></textarea></label>')+
 wide('<label>ملاحظات داخلية مشفرة<textarea name="private_notes" maxlength="5000" rows="5"></textarea></label>')+
 '</div></details>';
}
function personWizard(data,csrf){
 const fields='<div class="gen-bundle"><fieldset><legend>البيانات الأساسية</legend>'+
 '<div class="gen-form-grid"><label>الاسم الكامل *<input name="person_name" maxlength="200" minlength="3" required placeholder="الاسم الأول واسم الأب والجد"></label>'+
 '<label>الجنس<select name="person_gender"><option value="male">ذكر</option><option value="female">أنثى</option><option value="unknown">غير معروف</option></select></label>'+
 '<label>القبيلة / السجل'+tribeSelect(data)+'</label>'+
 familySelect(data)+
 '<label>نوع الوثيقة'+idKind('person_identity_kind')+'</label>'+
 '<label>هوية الشخص (اختياري)<input type="password" inputmode="numeric" name="person_identity" autocomplete="off" maxlength="50" placeholder="لا تُعرض أو تحفظ بصيغتها الخام"></label>'+dateInput('person_birth_date','تاريخ الميلاد','','')+'<label>مكان الميلاد (اختياري)<input name="person_birth_place" maxlength="120"></label></div></fieldset>'+
 '<details class="gen-details"'+(data.childOf?' open':'')+'><summary>الأب والأم</summary><div class="gen-step-notice">اختر شخصًا موجودًا من القائمة أو افتح البطاقة لإضافة الأب والأم بالاسم والهوية. يمكن إضافة الابن حتى لو لم تتوفر سجلات الأجداد كاملة.</div>'+
 relative(data,'father','الأب','ذكر')+relative(data,'mother','الأم','أنثى')+'</details>'+
 '<details class="gen-details"><summary>الأجداد من جهة الأب</summary>'+
 relative(data,'father_father','جد الأب','ذكر')+relative(data,'father_mother','جدة الأب','أنثى')+'</details>'+
 '<details class="gen-details"><summary>الأجداد من جهة الأم</summary>'+
 relative(data,'mother_father','جد الأم','ذكر')+relative(data,'mother_mother','جدة الأم','أنثى')+'</details>'+creationExtras()+
 '<div class="gen-note">جميع الأشخاص الجدد سجلات <b>خاصة وقيد المراجعة</b>. قد يُنشأ حتى ٧ أفراد في عملية واحدة؛ ولا يُنشر أي نسب في الدليل العام تلقائيًا.</div>'+
 '<label class="gen-check"><input name="confirm_reuse" type="checkbox" value="yes">أوافق على استخدام سجل موجود إذا تطابقت بصمة الهوية وراجعت اسم الشخص.</label>'+
 '<label class="gen-check"><input name="allow_duplicate_name" type="checkbox" value="yes">أتفهم وجود أسماء متشابهة وأوافق على إنشاء شخص مختلف بعد التحقق.</label></div>';
 return form('create_tree',csrf,fields,'حفظ الفرد وشجرة أصوله');
}
function registryPagination(data, units=false){
 const page=(units?data.unitPage:data.peoplePage)||1;
 const hasMore=units?data.hasMoreUnits:data.hasMorePeople;
 if(page===1&&!hasMore)return '';
 const url=number=>{
  const params=new URLSearchParams({q:data.q||'',unit_q:data.unitQ||''});
  if(units)params.set('view','units');
  if(data.personStatus)params.set('person_status',data.personStatus);
  if(data.gap)params.set('gap',data.gap);
  if(units&&data.peoplePage>1)params.set('people_page',data.peoplePage);
  if(!units&&data.unitPage>1)params.set('unit_page',data.unitPage);
  params.set(units?'unit_page':'people_page',number);
  return '/admin/genealogy?'+params+(units?'#gen-units':'#gen-people');
 };
 return '<nav class="gen-pagination" aria-label="'+(units?'صفحات وحدات النسب':'صفحات سجل الأفراد')+'">'+
   (page>1?'<a class="gen-compact-button" rel="prev" href="'+e(url(page-1))+'">السابقة</a>':'')+
   '<span>الصفحة '+n(page)+'</span>'+
   (hasMore?'<a class="gen-compact-button" rel="next" href="'+e(url(page+1))+'">التالية</a>':'')+
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
    '<td>'+ (data.canEditPeople?'<a class="gen-compact-button" href="'+e(url)+'">فتح السجل</a>':'—')+'</td></tr>';
 }).join('')+'</tbody></table></div>';
}
const dateValue=value=>{
 if(!value)return '';
 const date=new Date(value);
 return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10);
};
const dateInput=(name,title,value,precision)=>{
 const formatted=dateValue(value);
 const display=precision==='year'?formatted.slice(0,4):precision==='month'?formatted.slice(0,7):formatted;
 return '<label>'+title+'<input name="'+name+'" value="'+e(display)+'" placeholder="YYYY أو YYYY-MM أو YYYY-MM-DD" maxlength="10" dir="ltr"></label>'+
  '<label class="gen-check"><input type="checkbox" name="'+name+'_estimated" value="yes"'+(precision==='estimated'?' checked':'')+'>تاريخ تقريبي</label>';
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
 const linkedParents=relations.spouses.filter(member=>['current','reported'].includes(member.marriage_status))
  .map(member=>'<button type="button" class="gen-compact-button" data-co-parent-known="'+e(member.id)+'">'+e(member.full_name_ar)+'</button>').join('');
 const add=form('add_relation',csrf,
  h('person_id',p.id)+
  '<div class="gen-form-grid">'+
  '<label>صلة القرابة المطلوب إضافتها *<select name="relation_role" required>'+roles+'</select></label>'+
  lookupFields('relative','relative_id','شخص موجود في سجلات الديوان')+
  input('relative_name','الاسم الكامل عند إنشاء سجل جديد','',200,'text','autocomplete="off"')+
  '<label>جنس القريب الجديد<select name="relative_gender">'+genderOpts+'</select></label>'+
  familySelect(data,'','relative_family_id')+
  '<div class="gen-full" data-coparent>'+lookupFields('co_parent','co_parent_id','الأب أو الأم الآخر للابن أو الابنة')+
  (linkedParents?'<div class="gen-action-group"><span class="gen-muted">أو اختر من الأزواج المرتبطين:</span>'+linkedParents+'</div>':
   '<p class="gen-muted">سجّل علاقة الزواج أولًا ليصبح الطرف الآخر متاحًا عند إضافة الأبناء.</p>')+'</div>'+
  '<label data-marriage-date>تاريخ الزواج (اختياري)<input type="date" name="marriage_start_date"></label>'+
  '<label>تاريخ الميلاد<input type="date" name="relative_birth_date"></label>'+
  input('relative_birth_place','مكان الميلاد','',120)+
  '<label>حالة الحياة<select name="relative_living_status"><option value="unknown">غير معروف</option><option value="alive">حي</option><option value="deceased">متوفى</option></select></label>'+
  h('confirm_reuse','yes')+
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
   'حفظ صلة القرابة');
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
 const section=(title,body,open=false)=>'<details class="gen-edit-fieldset"'+(open?' open':'')+'><summary>'+title+'</summary>'+body+'</details>';
 const editor=h('id',p.id)+
  section('الاسم والعائلة','<div class="gen-form-grid">'+
  wide(input('full_name','الاسم الكامل',p.full_name_ar,200,'text','required'))+
  input('given_name','الاسم الأول',p.given_name_ar,100)+input('middle_name','اسم الأب والأجداد',p.middle_name_ar,150)+
  input('surname','اسم العائلة أو اللقب',p.surname_ar,100)+
  '<label>الجنس'+genderSelect(p.gender)+'</label>'+
  familySelect(data,p.family_unit_id,'family_id')+
  h('father_id',p.father_id)+h('mother_id',p.mother_id)+
  wide('<p><a href="#gen-family-relations" data-open-relations>إدارة الأب والأم وبقية الأقارب عبر الهوية</a></p>')+
  '</div><p class="gen-muted">يمكن إضافة أب أو أم غير مسجلين. تغيير الوالدين المرتبطين مسبقًا يتم عبر طلب تصحيح موثق لحماية تسلسل الأنساب.</p>',true)+
  section('الميلاد والوفاة والنبذة','<div class="gen-form-grid">'+
  input('birth_place','مكان الميلاد',p.birth_place,120)+
  dateInput('birth_date','تاريخ الميلاد',p.birth_date,p.birth_date_precision)+
  '<label>حالة الحياة<select name="living_status"><option value="unknown"'+selected('unknown',p.living_status)+'>غير معروفة</option><option value="alive"'+selected('alive',p.living_status)+'>حي</option><option value="deceased"'+selected('deceased',p.living_status)+'>متوفى</option></select></label>'+
  dateInput('death_date','تاريخ الوفاة',p.death_date,p.death_date_precision)+
  wide('<label>نبذة تعريفية (تخضع للمراجعة قبل إتاحتها)<textarea name="biography" maxlength="4000" rows="4">'+e(p.biography||'')+'</textarea></label>')+
  '</div>')+
  section('الهوية','<div class="gen-form-grid">'+
  wide('<p class="gen-sensitive">الهوية المسجلة: <strong dir="ltr">'+e(p.national_id_last4?'••••••'+p.national_id_last4:'غير موجودة في الملف الخاص')+'</strong>. لن يظهر الرقم الكامل بعد الحفظ، ويمكن استبدال الهوية غير المعتمدة برقم صحيح.</p>')+
  '<label>نوع الوثيقة'+idKind()+'</label>'+
  input('identity','تسجيل أو استبدال رقم الهوية','',50,'password','autocomplete="new-password" inputmode="numeric" placeholder="اتركه فارغًا للمحافظة على الحالي"')+
  wide('<label class="gen-check"><input type="checkbox" name="remove_identity" value="yes">إلغاء الهوية غير المعتمدة وحذف نسختها المشفّرة من الملف (اترك الرقم الجديد فارغًا)</label>')+
  '</div>')+
  section('العنوان الوطني والسكن','<div class="gen-form-grid">'+
  input('city','المدينة',p.city,100)+input('region','المنطقة',p.region,100)+
  input('country','رمز الدولة',p.country||'SA',2,'text','placeholder="SA"')+
  addressRows+'</div><p class="gen-muted">تفاصيل المبنى والشارع والحي والرمز البريدي والعنوان المختصر مشفّرة في قاعدة البيانات.</p>')+
  section('التواصل والعمل والتعليم','<div class="gen-form-grid">'+
  input('phone','رقم الجوال',p.phone,32,'tel','autocomplete="off"')+
  input('email','البريد الإلكتروني',p.email,254,'email','autocomplete="off"')+
  '<label>الحالة الوظيفية<select name="employment_status">'+employment+'</select></label>'+
  input('education_level','المؤهل العلمي',p.education_level,120)+
  input('employer','جهة العمل',p.employer,200)+
  input('job_title','المسمى الوظيفي',p.job_title,160)+
  '</div>')+
  section('الملاحظات الداخلية',
  '<p class="gen-muted">ملاحظات لا تُعرض للزوار أو في الشجرة العامة؛ محمية بالتشفير وصلاحيات الإدارة.</p>'+
  '<label>الملاحظات الداخلية<textarea name="private_notes" maxlength="5000" rows="7" placeholder="أضف ملاحظة داخلية">'+e(p.private_notes||'')+'</textarea></label>')+'<p class="gen-muted">حفظ التعديل يعيد السجل للمراجعة، ويحفظ المحتوى الخاص منفصلًا عن النبذة العامة.</p>';
 const birthDocuments=data.birthRecords?.length?'<details class="gen-details"><summary>سجلات الميلاد المرتبطة</summary>'+
  '<ul>'+data.birthRecords.map(record=>'<li>'+e([dateValue(record.born_on),record.birth_place_text,record.source_title].filter(Boolean).join(' · ')||'سجل ميلاد بلا تاريخ محدد')+
   (record.status?'<span class="gen-pill">'+e(status[record.status]||record.status)+'</span>':'')+'</li>').join('')+'</ul></details>':'';
 const edit=form('edit_person',csrf,editor,'حفظ جميع بيانات الفرد');
 const archive=form(p.record_status==='archived'?'restore_person':'archive_person',csrf,h('id',p.id)+
  '<label class="gen-check"><input type="checkbox" name="confirm" value="yes" required>أؤكد '+(p.record_status==='archived'?'استعادة':'أرشفة')+' سجل الفرد</label>',
  p.record_status==='archived'?'استعادة للمراجعة':'أرشفة السجل');
 const remove=form('delete_person_draft',csrf,h('id',p.id)+
  '<p class="gen-muted">الحذف الدائم مقيد بالمسودات غير المرتبطة بأبناء أو زوجات أو عضويات أو اعتماد رسمي.</p>'+
  '<label class="gen-check"><input type="checkbox" name="confirm" value="delete" required>أؤكد حذف المسودة غير المرتبطة</label>',
  'حذف المسودة');
 return '<section class="gen-section gen-editor" id="gen-person-edit">'+
  '<div class="gen-section-head"><div><h2>تعديل سجل: '+e(p.full_name_ar)+'</h2>'+
  '<small>افتح المجموعة المطلوبة ثم احفظ التعديلات.</small></div>'+
  '<a href="/admin/genealogy" class="gen-compact-button">رجوع للسجل</a><a href="#gen-family-relations" data-open-relations class="gen-compact-button">إدارة القرابة</a></div>'+
  '<div class="gen-editor-layout"><div class="gen-editor-main">'+edit+birthDocuments+'<details class="gen-details gen-relation-fold" id="gen-family-relations"><summary>القرابة والأصول والأبناء</summary>'+relationEditor(data,csrf)+'</details>'+'</div>'+
  '<aside class="gen-editor-side"><div class="gen-side-panel"><h3>حالة السجل</h3><span class="gen-pill">'+e(status[p.record_status]||p.record_status)+'</span>'+
  '<p class="gen-muted">ترتبط بيانات الأنساب بمراجعة موثقة. لا يؤدي تغيير البيانات الخاصة إلى نشرها للعامة.</p></div>'+
  '<details class="gen-details"><summary>أرشفة / استعادة السجل</summary>'+archive+'</details>'+
  '<details class="gen-details gen-danger"><summary>حذف المسودة (إن لم تكن مرتبطة)</summary>'+remove+'</details></aside></div></section>';
}
function unitRows(data){
 if(!data.units.length)return '<p class="gen-muted">لا توجد وحدات نسب في هذا البحث.</p>';
 return '<div class="gen-scroll"><table class="gen-table"><thead><tr><th>وحدة النسب</th><th>النوع</th><th>حالة النشر</th><th>الإدارة</th></tr></thead><tbody>'+
 data.units.map(unit=>{
  const url='/admin/genealogy?unit_id='+encodeURIComponent(unit.id)+'#gen-unit-edit';
  return '<tr><td>'+e(unit.name_ar)+'</td><td>'+e(types[unit.unit_type]||unit.unit_type)+'</td>'+
   '<td><span class="gen-pill">'+e(status[unit.review_status]||unit.review_status||'بلا مراجعة')+'</span></td>'+
   '<td>'+(data.canEditUnits?'<a class="gen-compact-button" href="'+e(url)+'">فتح محرر الوحدة</a>':'—')+'</td></tr>';
 }).join('')+'</tbody></table></div>';
}
function editUnitCard(data,csrf){
 const unit=data.focusedUnit;
 if(!unit||!data.canEditUnits)return '';
 const update=form('edit_unit',csrf,h('id',unit.id)+
   '<label>اسم الوحدة<input name="name" maxlength="150" value="'+e(unit.name_ar)+'" required></label>'+
   input('name_en','الاسم بالإنجليزية',unit.name_en,150)+
   '<label>الوصف<textarea name="description" maxlength="2000" rows="4">'+e(unit.description)+'</textarea></label>'+
   (unit.source_title?'<p class="gen-note">المصدر: '+e(unit.source_title)+'</p>':'')+
   '<label>الأصل'+unitSelect(data,unit.parent_id,'— دون أصل —',data.directoryUnits)+'</label>'+
   (unit.registered_fakhth&&Number(unit.child_count)>0?'<label class="gen-check"><input type="checkbox" name="confirm_subtree" value="yes">أؤكد نقل الفخذ مع توابعه عند تغيير الأصل</label>':'')+
   '<p class="gen-muted">يعود كل تعديل إلى قائمة المراجعة. نقل الفخذ ينقل الوحدات التابعة معه إلى الفرع الجديد بعد التأكيد.</p>',
   'حفظ تعديل الوحدة');
 const published=unit.review_status==='approved';
 const canDelete=unit.manual_draft&&unit.review_status==='needs_review'&&!unit.has_links;
 const withdraw=published?'<details class="gen-details"><summary>إيقاف النشر للمراجعة</summary>'+
  form('withdraw_unit',csrf,h('id',unit.id)+
   '<p class="gen-muted">تُزال الوحدة من العرض المعتمد وتبقى محفوظة مع روابطها في قاعدة البيانات.</p>'+
   '<label class="gen-check"><input type="checkbox" name="confirm" value="yes" required>أؤكد إيقاف نشر الوحدة</label>',
   'إيقاف النشر')+'</details>':'';
 const publish=data.canPublish&&['needs_review','verified'].includes(unit.review_status)?form('publish_unit',csrf,h('id',unit.id)+'<label class="gen-check"><input type="checkbox" name="confirm" value="yes" required>راجعت المصدر وتسلسل الوحدة وأوافق على النشر</label>','اعتماد النشر'):'';
 const removal=canDelete?'<details class="gen-details gen-danger"><summary>حذف المسودة</summary>'+
  form('delete_unit_draft',csrf,h('id',unit.id)+
   '<label class="gen-check"><input type="checkbox" name="confirm" value="delete" required>أؤكد حذف المسودة نهائيًا</label>',
   'حذف المسودة')+'</details>':'<p class="gen-note">'+(unit.has_links?
   'لهذه الوحدة سجلات مرتبطة. تُحفظ روابطها عند إيقاف النشر.':
   'الحذف الدائم متاح للمسودات اليدوية غير المعتمدة فقط.')+'</p>';
 return '<section class="gen-section" id="gen-unit-edit"><div class="gen-section-head"><div><h2>'+e(unit.name_ar)+'</h2>'+
   '<span class="gen-pill">'+e(status[unit.review_status]||unit.review_status||'بلا مراجعة')+'</span></div>'+
   '<a class="gen-compact-button" href="/admin/genealogy?view=units">العودة إلى الوحدات</a></div>'+
   (data.unitError?'<p class="gen-error" role="alert">'+e(data.unitError)+'</p>':'')+
   '<div class="gen-form-grid"><div>'+update+'</div><div class="gen-bundle"><h3>النشر والحذف</h3>'+publish+withdraw+removal+'</div></div></section>';

}
export function genealogyView(data,csrf){
 const metrics=[
  ['الأفراد',data.stats.people],['الفروع والعائلات',data.stats.units],
  ['أفراد قيد المراجعة',data.stats.drafts],['وحدات قيد المراجعة',data.stats.unit_reviews],
 ].map(([label,value])=>'<article><small>'+e(label)+'</small><strong>'+n(value)+'</strong></article>').join('');
 const requested=data.view==='sources'&&!data.canEditUnits?'people':data.view;
 const current=data.lookup?'identity':data.focusedPerson?'person':data.focusedUnit?'unit':
  (data.childOf?'create':Object.hasOwn(panels,requested)?requested:data.unitPage>1||!data.q&&data.unitQ?'units':'people');
 const active=current==='person'?'people':current==='unit'?'units':current;
 const shortcuts='<nav class="gen-services" aria-label="أقسام إدارة الأنساب">'+
  Object.entries(panels).filter(([key])=>(key!=='create'||data.canEditPeople)&&(key!=='sources'||data.canEditUnits))
   .map(([key,label])=>'<a href="'+panelLink(key)+'"'+(key===active?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav>';
 const identityBox=data.lookup?'<div class="gen-result" role="status">'+
   (data.lookup.matched?'الهوية مسجلة باسم: '+e(data.lookup.record.full_name_ar)+' • '+e(data.lookup.record.masked_value||'رقم مقنّع')+' • الحالة: '+e(status[data.lookup.record.record_status]||data.lookup.record.record_status)+(data.canEditPeople?' <a href="/admin/genealogy?person_id='+encodeURIComponent(data.lookup.record.id)+'#gen-person-edit">فتح سجل الفرد</a>':''):
   'لا يوجد تطابق لهذه الهوية في الفهرس الحالي. يمكن إضافة الشخص كمراجعة جديدة.')+
  '</div>':'';
 const identitySearch=form('lookup_identity',csrf,
  '<div class="gen-form-grid"><label>نوع الهوية'+idKind()+'</label>'+
  '<label>الرقم المطلوب مطابقته<input name="identity" type="password" inputmode="numeric" autocomplete="off" maxlength="50" required placeholder="لا تظهر الهوية في الرابط أو نتائج البحث"></label></div>',
  'فحص وجود الهوية');
 const unitForm=()=>form('create_unit',csrf,
  '<div class="gen-form-grid"><label>القبيلة'+tribeSelect(data)+'</label>'+
  '<label>النوع<select name="unit_type"><option value="branch">فرع</option><option value="clan">بطن</option><option value="subclan">فخذ</option><option value="family">عائلة</option><option value="house">بيت</option></select></label>'+
  '<label>الاسم<input name="name" required maxlength="150" placeholder="اسم الفخذ أو العائلة"></label>'+
  '<label>تابع إلى'+unitSelect(data)+'</label>'+
  '<label class="gen-wide">مصدر التوثيق<select name="source_id" required>'+options(data.sources,'id',s=>s.title+' · '+s.source_type,'','— اختر مصدرًا —')+'</select></label></div>'+
  '<p class="gen-muted">الفخذ يحتاج أصلًا من الفروع، والعائلة تحتاج فخذًا. السجلات الجديدة لا تُنشر قبل اعتمادها.</p>', 'إضافة الفخذ أو العائلة');
 const identity=()=>'<section class="gen-section" id="gen-identity"><h2>مطابقة هوية</h2>'+
  '<p class="gen-muted">أدخل الرقم الكامل. تظهر نتيجة المطابقة برقم مقنّع.</p>'+identityBox+identitySearch+'</section>';
 const create=()=>data.canEditPeople?'<section class="gen-section" id="gen-tree-create"><h2>إضافة فرد</h2>'+
  (data.childOf?'<p class="gen-result">الوالد المرتبط: '+e(data.childOf.full_name_ar)+'</p>':'')+
  personWizard(data,csrf)+'</section>':'<p class="gen-note">إضافة الأفراد تتطلب صلاحية تعديل الهوية.</p>';
 const people=()=>'<section class="gen-section" id="gen-people"><div class="gen-section-head"><h2>سجل الأفراد</h2>'+
  (data.canEditPeople?'<a class="gen-submit" href="'+panelLink('create')+'">إضافة فرد</a>':'')+'</div>'+
  '<form method="get" action="/admin/genealogy#gen-people" class="gen-search"><label>اسم الفرد<input type="search" maxlength="70" name="q" value="'+e(data.q)+'" placeholder="الاسم أو اللقب"></label>'+
  '<label>حالة السجل<select name="person_status"><option value="">الكل</option>'+
  ['under_review','verified','disputed','archived'].map(key=>'<option value="'+key+'"'+(key===data.personStatus?' selected':'')+'>'+status[key]+'</option>').join('')+
  '</select></label><label>اكتمال البيانات<select name="gap"><option value="">الكل</option>'+
  '<option value="birth"'+(data.gap==='birth'?' selected':'')+'>بدون تاريخ ميلاد</option>'+
  '<option value="family"'+(data.gap==='family'?' selected':'')+'>بدون عائلة</option>'+
  '</select></label><button type="submit">بحث</button><a class="gen-compact-button" href="'+panelLink('people')+'">مسح</a></form>'+
  '<div class="gen-links gen-gaps"><a href="'+genealogyPath+'?gap=birth">بدون تاريخ ميلاد ('+n(data.stats.missing_birth)+')</a>'+
  '<a href="'+genealogyPath+'?gap=family">بدون عائلة ('+n(data.stats.missing_family)+')</a></div>'+
  personRows(data)+registryPagination(data)+'</section>';
 const units=()=>'<section class="gen-section" id="gen-units"><div class="gen-section-head"><h2>الفروع والعائلات</h2>'+
  '<a class="gen-compact-button" href="/dashboard/tree">فتح الشجرة</a></div>'+
  (data.canEditUnits?'<details class="gen-details"><summary>إضافة وحدة نسب</summary>'+unitForm()+'</details>':'')+
  '<form method="get" action="/admin/genealogy#gen-units" class="gen-search">'+h('view','units')+
  '<label>اسم الوحدة<input name="unit_q" type="search" maxlength="70" value="'+e(data.unitQ)+'"></label><button type="submit">بحث</button></form>'+
  unitRows(data)+registryPagination(data,true)+'</section>';
 const sources=()=>'<section class="gen-section"><h2>مصادر التوثيق</h2>'+
  (data.sources.length?'<div class="gen-scroll"><table class="gen-table"><thead><tr><th>المصدر</th><th>النوع</th><th>المؤلف</th><th>السنة</th></tr></thead><tbody>'+
   data.sources.map(item=>'<tr><td>'+e(item.title)+'</td><td>'+e(item.source_type)+'</td><td>'+e(item.author||'—')+'</td><td>'+e(item.publication_year||'—')+'</td></tr>').join('')+
   '</tbody></table></div>':'<p class="gen-muted">لا توجد مصادر مسجلة.</p>')+'</section>';
 const content={people,create,identity,units,sources};
 const selected=current==='person'?editPersonCard(data,csrf)||people():current==='unit'?editUnitCard(data,csrf)||units():content[current]();
 return '<style>'+genealogyStyles+'</style><div class="gen-shell">'+shortcuts+
  (current==='people'?'<div class="gen-summary">'+metrics+'</div>':'')+selected+'</div>';
}
