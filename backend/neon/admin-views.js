
import { escapeHtml as esc, page } from './member-views.js';
const e=x=>esc(x??'');
const num=x=>new Intl.NumberFormat('ar-SA').format(Number(x||0));
const date=x=>x?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Riyadh'}).format(new Date(x)):'—';
const ICONS={
 overview:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
 members:'<circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2 M17 8a3 3 0 0 1 0 6 M18 16a5 5 0 0 1 4 4"/>',
 requests:'<path d="M7 3h10l4 4v14H7z M17 3v5h5 M10 13h7 M10 17h5"/>',
 services:'<path d="M3 8h18v13H3z M8 8V5a4 4 0 0 1 8 0v3 M3 13h18"/>',
 claims:'<path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6z M9 12l2 2 4-4"/>',
 roles:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2 M20 5v5 M18 8h4"/>',
 audit:'<circle cx="11" cy="11" r="8"/><path d="m17 17 5 5 M8 11l2 2 4-4"/>',
 system:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h10 M7 13h10"/>',
};
const icon=(name,size=22)=>'<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[name]||ICONS.overview)+'</svg>';
const names={overview:'نظرة عامة',members:'الأعضاء',requests:'طلبات التغيير',services:'الخدمات',claims:'ربط السجلات',roles:'الأدوار والصلاحيات',audit:'سجل التدقيق',system:'حالة النظام'};
const navOrder=['overview','members','requests','services','claims','roles','audit','system'];
const css=`
.adm-root{--a:#076a45;--b:#075138;--sub:#6a7c72;--bd:#deebe3;display:grid;grid-template-columns:230px minmax(0,1fr);gap:22px;align-items:start}
.adm-side{background:#fff;border:1px solid var(--bd);border-radius:20px;position:sticky;top:108px;padding:14px;box-shadow:0 14px 34px #06452a0a}
.adm-side-title{padding:12px 13px 18px;border-bottom:1px solid var(--bd);margin-bottom:12px;color:#074a30;font-weight:900}
.adm-nav{display:grid!important;max-width:none!important;gap:4px!important;padding:0!important}
.adm-nav a{display:flex!important;gap:11px;align-items:center;border-radius:11px;padding:11px 12px!important;color:#456354!important;font-size:.9rem!important;text-decoration:none;min-height:46px}
.adm-nav a[aria-current=page],.adm-nav a:hover{background:#e8f5ed!important;color:#075d3b!important;font-weight:850}
.adm-main{min-width:0}
.adm-hero{border-radius:23px;color:#fff;background:linear-gradient(115deg,#05432e,#08794d);padding:clamp(22px,4vw,36px);position:relative;overflow:hidden;box-shadow:0 16px 32px #03493222}
.adm-hero:after{content:"";position:absolute;border-radius:50%;border:1px solid #ffffff33;width:260px;height:260px;inset-inline-end:-50px;top:-100px;box-shadow:0 0 0 42px #ffffff08,0 0 0 88px #ffffff09;pointer-events:none}
.adm-eyebrow{font-size:.77rem;font-weight:800;color:#d8efdf;letter-spacing:.06em}
.adm-hero h1{margin:4px 0;font-size:clamp(1.5rem,3vw,2.1rem)}
.adm-hero p{max-width:680px;font-size:.9rem;color:#e2f4e9}
.adm-crumbs{display:flex;flex-wrap:wrap;gap:9px;align-items:center;font-size:.8rem;color:var(--sub);margin-bottom:14px}
.adm-crumbs a{color:var(--a)}
.adm-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px;margin:18px 0 25px}
.adm-metric{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid var(--bd);border-radius:16px;padding:18px;text-decoration:none;box-shadow:0 8px 21px #003e2408}
.adm-metric-icon{display:grid;place-items:center;width:43px;height:43px;color:#086a45;background:#e7f5ec;border-radius:12px}
.adm-metric small,.adm-muted{font-size:.82rem;color:var(--sub)}
.adm-metric strong{font-size:1.65rem;line-height:1.15;color:var(--b)}
.adm-card{background:var(--surface);border:1px solid var(--bd);border-radius:17px;padding:clamp(16px,3vw,23px);box-shadow:0 9px 25px #003c2509;margin:16px 0}
.adm-card h2{font-size:1.13rem;color:var(--text)}
.adm-topline{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap;margin-bottom:13px}
.adm-link{color:var(--a);font-weight:800;font-size:.83rem}
.adm-table-wrap{overflow-x:auto;max-width:100%}
.adm-table{width:100%;border-collapse:collapse;white-space:nowrap;text-align:start;font-size:.86rem}
.adm-table th,.adm-table td{padding:13px 11px;border-bottom:1px solid var(--bd);text-align:start;vertical-align:middle}
.adm-table th{background:#f6faf7;color:#65796e;font-size:.76rem;font-weight:800}
.adm-table tr:last-child td{border:0}
.adm-table td.wide{max-width:240px;overflow:hidden;text-overflow:ellipsis}
.adm-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;color:#3e6251;background:#edf3ef;font-size:.76rem;font-weight:750}
.adm-badge.good{color:#086044;background:#e4f7eb}.adm-badge.warn{color:#85600b;background:#fff5d9}.adm-badge.bad{color:#9d3734;background:#ffeded}
.adm-empty{display:grid;place-items:center;text-align:center;gap:7px;padding:36px 10px;color:var(--sub)}
.adm-empty strong{color:var(--text)}
.adm-tools{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin-top:17px}
.adm-tools label,.adm-form label{font-weight:700;font-size:.82rem;display:grid;gap:5px}
.adm-tools input,.adm-tools select,.adm-form input,.adm-form select,.adm-form textarea{font:inherit;color:var(--text);background:var(--surface);border:1px solid var(--line);border-radius:10px;min-height:43px;padding:8px 11px;max-width:100%}
.adm-tools input{min-width:min(100%,240px)}
.adm-button{border:0;border-radius:10px;background:#096945;color:#fff;font-weight:750;min-height:43px;padding:8px 15px;cursor:pointer}
.adm-button:hover{background:#07543a}
.adm-button.ghost{background:#edf6f0;color:#06613e}.adm-button.danger{background:#a4413f;color:#fff}
.adm-detail{border:1px solid var(--bd);border-radius:12px;background:#fafdfb;padding:13px;margin:10px 0}
.adm-detail summary{font-weight:750;cursor:pointer;color:#086947}
.adm-form{display:grid;gap:13px;margin-top:14px}
.adm-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:end}
.adm-actions select{min-width:135px}
.adm-note{padding:10px 13px;border-radius:10px;background:#f2f7f4;border:1px solid var(--bd);font-size:.83rem;color:#53695b}
.adm-notice{padding:12px 16px;border-radius:12px;background:#e8f6ed;color:#09633e;margin-top:15px;font-weight:700}
.adm-error{background:#fff0ef;color:#a33c38}
.adm-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:7px;max-height:340px;overflow:auto;padding:10px;border:1px solid var(--bd);border-radius:12px}
.adm-options label{display:flex;gap:7px;align-items:center;min-height:36px;font-weight:500}
.adm-options input{min-height:auto;width:17px;accent-color:var(--a)}
.adm-pagination{display:flex;flex-wrap:wrap;align-items:center;gap:10px;justify-content:space-between;margin-top:16px}
.adm-page-link{padding:7px 12px;border:1px solid var(--bd);border-radius:10px;text-decoration:none}
.adm-page-link:hover{background:#e9f7ee}
.adm-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
.adm-chiprow{display:flex;gap:7px;flex-wrap:wrap}
.adm-kv{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:10px 0;border-bottom:1px solid var(--bd);font-size:.88rem}
.adm-kv span:first-child{color:var(--sub)}
.adm-chip{background:#eff7f1;border-radius:8px;padding:5px 9px;font-size:.79rem}
@media(max-width:900px){.adm-root{grid-template-columns:1fr}.adm-side{position:static;padding:10px}.adm-side-title{padding:8px 10px;margin-bottom:6px}.adm-nav{display:flex!important;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:thin}.adm-nav a{white-space:nowrap;flex:0 0 auto}.adm-two{grid-template-columns:1fr}}
@media(max-width:450px){.adm-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.adm-metric{padding:12px}.adm-metric strong{font-size:1.3rem}.adm-hero{padding:22px}}
@media(prefers-reduced-motion:reduce){.adm-root *{scroll-behavior:auto}}
`;
const statusLabels={active:'نشط',pending:'بانتظار التفعيل',suspended:'موقوف',submitted:'مقدّم',triage:'فرز',needs_evidence:'يتطلب مستندات',approved:'معتمد',rejected:'مرفوض',draft:'مسودة',retired:'مؤرشف',review:'قيد المراجعة',in_review:'قيد المراجعة',completed:'مكتمل',cancelled:'ملغى'};
const status=v=>{
 const type=['active','approved','completed','success'].includes(v)?'good':['rejected','suspended','failed'].includes(v)?'bad':['submitted','triage','needs_evidence','pending','review','in_review'].includes(v)?'warn':'';
 return '<span class="adm-badge '+type+'">'+e(statusLabels[v]||v||'—')+'</span>';
};
const card=(title,body,extra='')=>'<section class="adm-card"><div class="adm-topline"><h2>'+e(title)+'</h2>'+extra+'</div>'+body+'</section>';
const empty=(title='لا توجد سجلات',message='ستظهر البيانات هنا عند توفرها.')=>'<div class="adm-empty">'+icon('system',30)+'<strong>'+e(title)+'</strong><p>'+e(message)+'</p></div>';
const table=(heads,rows)=>rows.length?'<div class="adm-table-wrap"><table class="adm-table"><thead><tr>'+heads.map(t=>'<th>'+e(t)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>':empty();
const tr=cells=>'<tr>'+cells.map(c=>'<td>'+c+'</td>').join('')+'</tr>';
const h=(name,value)=>'<input type="hidden" name="'+e(name)+'" value="'+e(value)+'">';
const form=(section,csrf,op,fields,button='حفظ التغيير',danger=false)=>
 '<form method="post" action="/admin/'+section+'" class="adm-form">'+h('csrf',csrf)+h('operation',op)+fields+'<div><button class="adm-button '+(danger?'danger':'')+'" type="submit">'+e(button)+'</button></div></form>';
const pager=(section,filter,data)=>{
 if(!data||data.total<=data.limit)return '';
 const pages=Math.ceil(data.total/data.limit);
 const url=p=>'/admin/'+section+'?page='+p+'&q='+encodeURIComponent(filter.q)+'&status='+encodeURIComponent(filter.status);
 return '<div class="adm-pagination"><span class="adm-muted">صفحة '+num(data.page)+' من '+num(pages)+' • '+num(data.total)+' سجل</span><span class="adm-chiprow">'+(data.page>1?'<a class="adm-page-link" href="'+e(url(data.page-1))+'">السابق</a>':'')+(data.page<pages?'<a class="adm-page-link" href="'+e(url(data.page+1))+'">التالي</a>':'')+'</span></div>';
};
const filters=(section,filter,options=[])=>'<form method="get" action="/admin/'+section+'" class="adm-tools"><label>بحث<input type="search" name="q" value="'+e(filter.q)+'" placeholder="ابحث بالاسم أو البريد..."></label>'+ (options.length?'<label>الحالة<select name="status"><option value="">جميع الحالات</option>'+options.map(v=>'<option value="'+e(v)+'" '+(v===filter.status?'selected':'')+'>'+e(statusLabels[v]||v)+'</option>').join('')+'</select></label>':'')+'<button type="submit" class="adm-button">تطبيق الفلاتر</button><a class="adm-link" href="/admin/'+section+'">مسح</a></form>';
const rowTime=x=>'<span class="adm-muted">'+date(x)+'</span>';
const actionButton=(sec,csrf,op,hiddenFields,choices,description)=>{
 const fields=Object.entries(hiddenFields).map(([k,v])=>h(k,v)).join('')+choices;
 return '<details class="adm-detail"><summary>إجراءات الإدارة</summary>'+(description?'<p class="adm-note">'+e(description)+'</p>':'')+form(sec,csrf,op,fields,'تأكيد وتنفيذ')+'</details>';
};
function home(data){
 const metricNames=['الحسابات المسجلة','سجلات النسب','طلبات تغيير مفتوحة','طلبات خدمات مفتوحة','طلبات ربط السجلات','الخدمات النشطة','التفويضات النشطة'];
 const urls=['members','overview','requests','services','claims','services','roles'];
 const icons=['members','claims','requests','services','claims','services','roles'];
 const metrics='<div class="adm-metrics">'+data.metrics.map((v,i)=>'<a class="adm-metric" href="/admin/'+urls[i]+'"><span class="adm-metric-icon">'+icon(icons[i])+'</span><small>'+metricNames[i]+'</small><strong>'+num(v)+'</strong></a>').join('')+'</div>';
 const recent=table(['النوع','مقدّم الطلب','الحالة','التاريخ'],data.recent.map(r=>tr([e(r.request_type),e(r.email||'غير متاح'),status(r.status),rowTime(r.created_at)])));
 const events=table(['الحدث','المنفّذ','النتيجة','التاريخ'],data.events.map(a=>tr([e(a.event_type),e(a.email||'النظام'),status(a.outcome),rowTime(a.created_at)])));
 return metrics+'<div class="adm-two">'+card('آخر طلبات التغيير',recent,'<a class="adm-link" href="/admin/requests">عرض الكل</a>')+card('آخر أحداث التدقيق',events,'<a class="adm-link" href="/admin/audit">عرض السجل</a>')+'</div>'+card('إجراءات سريعة','<div class="adm-chiprow"><a class="adm-button ghost" href="/admin/members">إدارة الأعضاء</a><a class="adm-button ghost" href="/admin/requests">مراجعة الطلبات</a><a class="adm-button ghost" href="/admin/roles">الأدوار والصلاحيات</a><a class="adm-button ghost" href="/admin/system">مراقبة النظام</a></div>');
}
function memberList(data,filter,csrf){
 const rows=data.rows.map(u=>{
  const details=u.is_admin?'<span class="adm-badge good">حساب إداري محمي</span>':u.verified?status('active'):status('pending');
  const actions=u.is_admin?'<span class="adm-muted">محمي من الإيقاف</span>':actionButton('members',csrf,'change_member',{id:u.id},'<label>الإجراء<select name="state"><option value="suspended">إيقاف العضوية</option><option value="active">تفعيل الحساب</option></select></label><label><input type="checkbox" name="confirm" value="yes" required> أؤكد تغيير الحالة</label>','يتطلب بريدًا مؤكّدًا. لا يثبت هذا الإجراء النسب تلقائيًا.');
  return tr(['<strong>'+e(u.name||'غير محدد')+'</strong><div class="adm-muted" dir="ltr">'+e(u.email)+'</div>',details,status(u.account_status),rowTime(u.created_at),actions]);
 });
 return card('دليل حسابات الأعضاء',filters('members',filter)+table(['العضو','البريد','حالة الحساب','تاريخ الإنشاء','الإدارة'],rows)+pager('members',filter,data));
}
function requestList(data,filter,csrf){
 const rows=data.rows.map(r=>{
  const open=['submitted','triage','needs_evidence'].includes(r.status);
  const choices=h('id',r.id)+h('expected',r.status)+'<label>القرار<select name="next" required><option value="triage">بدء الفرز</option><option value="needs_evidence">طلب مستندات</option><option value="approved">اعتماد القرار</option><option value="rejected">رفض الطلب</option></select></label><label>ملاحظات المراجعة<textarea name="note" maxlength="600" minlength="10" rows="3" required placeholder="سبب القرار والتحقق الذي أجريته"></textarea></label>';
  const actions=open?form('requests',csrf,'review_request',choices,'تسجيل قرار المراجعة'):'<span class="adm-muted">أُغلقت المراجعة</span>';
  return tr([e(r.request_type),'<div dir="ltr">'+e(r.email||'غير متاح')+'</div><small class="adm-muted">'+e((r.justification||'').slice(0,80))+'</small>',status(r.status),rowTime(r.created_at),'<details class="adm-detail"><summary>عرض ومراجعة</summary><p class="adm-note">'+e(r.justification||'لا يوجد مبرر')+'</p><p class="adm-note">اعتماد الطلب يسجّل القرار فقط ولا يغيّر بيانات النسب تلقائيًا.</p>'+actions+'</details>']);
 });
 return card('مركز مراجعة طلبات التغيير',filters('requests',filter,['submitted','triage','needs_evidence','approved','rejected','cancelled'])+table(['الطلب','المقدّم','الحالة','التاريخ','المراجعة'],rows)+pager('requests',filter,data));
}
function serviceList(data,filter,csrf){
 const rows=data.rows.map(s=>tr(['<strong>'+e(s.title_ar)+'</strong><div class="adm-muted" dir="ltr">'+e(s.service_key)+'</div>',status(s.status),e(s.visibility),rowTime(s.created_at),['draft','active'].includes(s.status)?form('services',csrf,'change_service',h('id',s.id)+h('expected',s.status)+h('next',s.status==='active'?'draft':'active'),s.status==='active'?'إرجاع للمسودة':'نشر الخدمة'):'<span class="adm-muted">مؤرشفة</span>']));
 const backlog=table(['الخدمة','مقدم الطلب','الحالة','التاريخ'],data.backlog.map(r=>tr([e(r.title_ar||'خدمة'),e(r.email||'عضو'),status(r.state),rowTime(r.created_at)])));
 return card('كتالوج الخدمات',filters('services',filter,['draft','active','retired'])+table(['الخدمة','الحالة','الظهور','التاريخ','النشر'],rows)+pager('services',filter,data))+card('أحدث طلبات الخدمات',backlog);
}
function claimsList(data,filter,csrf){
 const rows=data.rows.map(c=>{
  const open=['submitted','review','needs_evidence'].includes(c.status);
  const choices=h('id',c.id)+h('expected',c.status)+'<label>القرار<select name="next"><option value="review">قيد المراجعة</option><option value="needs_evidence">طلب إثبات</option><option value="rejected">رفض المطالبة</option></select></label>';
  return tr([e(c.full_name_ar||'سجل شخص'),e(c.email||'غير متاح'),status(c.status),rowTime(c.created_at),open?form('claims',csrf,'review_claim',choices,'تسجيل القرار'):'<span class="adm-muted">مغلقة</span>']);
 });
 return card('طلبات ربط الحساب بسجلات النسب','<p class="adm-note">حماية الأنساب: الاعتماد النهائي وربط الشخص يتطلبان مسار تحقق مستقلًا. الرفض أو طلب الإثبات متاحان هنا.</p>'+filters('claims',filter,['submitted','review','needs_evidence','approved','rejected','withdrawn'])+table(['السجل','المتقدم','الحالة','التاريخ','المراجعة'],rows)+pager('claims',filter,data));
}
function roleList(data,csrf){
 const rows=data.roles.map(r=>tr(['<strong>'+e(r.name_ar)+'</strong><div class="adm-muted" dir="ltr">'+e(r.role_key)+'</div>',r.is_system?'<span class="adm-badge good">دور نظام محمي</span>':'<span class="adm-badge">دور مخصص</span>',status(r.role_state),num(r.permission_count),e(r.max_scope)]));
 const roleOptions=data.roles.filter(r=>!r.is_system&&r.role_state==='active'&&r.max_scope==='tribe').map(r=>'<option value="'+e(r.id)+'">'+e(r.name_ar)+'</option>').join('');
 const members=data.users.map(u=>'<option value="'+e(u.id)+'">'+e(u.email)+'</option>').join('');
 const tribes=data.tribes.map(t=>'<option value="'+e(t.id)+'">'+e(t.name_ar)+'</option>').join('');
 const canAssign=roleOptions&&members&&tribes;
 const assign=canAssign?form('roles',csrf,'grant_role','<label>الدور<select name="role" required>'+roleOptions+'</select></label><label>الحساب<select name="target" required>'+members+'</select></label><label>النطاق القبلي<select name="tribe" required>'+tribes+'</select></label>','منح الدور'):'<p class="adm-note">يلزم إنشاء دور مخصص مع وجود مستخدم مؤكد وقبيلة معتمدة قبل منح الصلاحية.</p>';
 const permitted=data.permissions.map(p=>'<label><input type="checkbox" name="permission" value="'+e(p.id)+'"><span>'+e(p.display_name_ar||p.permission_key)+' <small class="adm-muted" dir="ltr">'+e(p.permission_key)+'</small></span></label>').join('');
 const create=form('roles',csrf,'create_role','<label>اسم الدور بالعربية<input name="name" required minlength="3" maxlength="100" placeholder="مثال: مشرف الطلبات"></label><label>مفتاح الدور بالإنجليزية<input name="key" required pattern="[a-z][a-z0-9_-]{1,63}" maxlength="64" placeholder="requests_supervisor" dir="ltr"></label><p class="adm-note">صلاحيات عادية وحساسة فقط؛ صلاحيات النظام الحرجة لا يمكن تفويضها من هذه الواجهة.</p><div class="adm-options">'+permitted+'</div>','إنشاء دور معتمد');
 const assigned=data.assignments.map(a=>tr([e(a.email),e(a.name_ar),e(a.scope_type),rowTime(a.approved_at),a.is_system?'<span class="adm-badge good">محمي</span>':form('roles',csrf,'revoke_role',h('id',a.id)+'<label><input type="checkbox" name="confirm" value="yes" required> أؤكد الإلغاء</label>','سحب التفويض',true)]));
 return card('الأدوار الحالية',table(['الدور','النوع','الحالة','الصلاحيات','النطاق'],rows))+'<div class="adm-two">'+card('إنشاء دور مخصص',create)+card('تفويض دور لمستخدم',assign)+'</div>'+card('التفويضات الفعّالة',table(['المستخدم','الدور','النطاق','تاريخ الاعتماد','الإجراء'],assigned));
}
function auditList(data,filter){
 const rows=data.rows.map(a=>tr(['<strong>'+e(a.event_type)+'</strong>',e(a.email||'النظام'),status(a.outcome),rowTime(a.created_at),'<details><summary class="adm-link">التفاصيل</summary><code dir="ltr" style="display:block;white-space:pre-wrap;overflow-wrap:anywhere">'+e(JSON.stringify(a.metadata||{}).slice(0,700))+'</code></details>']));
 return card('سجل تدقيق الإجراءات',filters('audit',filter)+table(['الإجراء','المنفذ','النتيجة','التاريخ','البيانات'],rows)+pager('audit',filter,data));
}
function systemView(data){
 const db=card('قاعدة البيانات', '<div class="adm-kv"><span>الإصدار</span><strong dir="ltr">'+e(data.server.db_version)+'</strong></div><div class="adm-kv"><span>آخر اتصال ناجح</span><strong>'+rowTime(data.server.checked_at)+'</strong></div>');
 const controls=card('حالة الصلاحيات','<div class="adm-kv"><span>إجمالي الصلاحيات</span><strong>'+num(data.permissions.total)+'</strong></div><div class="adm-kv"><span>الصلاحيات النشطة</span><strong>'+num(data.permissions.active)+'</strong></div><p class="adm-note">هذه مؤشرات قاعدة البيانات، ولا تعني أن نسخة احتياطية أُخذت بنجاح.</p>');
 const backups=table(['النوع','بدأ في','انتهى في','النتيجة'],data.backups.map(b=>tr([e(b.backup_kind),rowTime(b.started_at),rowTime(b.completed_at),status(b.result)])));
 return '<div class="adm-two">'+db+controls+'</div>'+card('سجل النسخ الاحتياطية',backups);
}
export function adminView(section,user,data,filter,csrf,done=false){
 const title=names[section]||'الإدارة';
 const sidebar='<aside class="adm-side"><div class="adm-side-title">مركز إدارة الديوان</div><nav class="adm-nav" aria-label="أقسام الإدارة">'+navOrder.map(k=>'<a href="/admin/'+k+'" '+(k===section?'aria-current="page"':'')+'>'+icon(k,20)+e(names[k])+'</a>').join('')+'</nav></aside>';
 const description=section==='overview'?'مؤشرات مباشرة وإجراءات منظمة لإدارة عضوية الديوان ومحتواه وصلاحياته.': 'جميع العمليات الحساسة محمية بمراجعة الصلاحية وسجل تدقيق.';
 const hero='<div class="adm-crumbs"><a href="/dashboard">لوحة التحكم</a><span> / </span><a href="/admin">الإدارة</a><span> / </span><strong>'+e(title)+'</strong></div><header class="adm-hero"><span class="adm-eyebrow">DIWAN / MANAGEMENT CONSOLE</span><h1>'+icon(section,27)+' '+e(title)+'</h1><p>'+e(description)+'</p></header>';
 let content='';
 if(section==='overview')content=home(data);
 else if(section==='members')content=memberList(data,filter,csrf);
 else if(section==='requests')content=requestList(data,filter,csrf);
 else if(section==='services')content=serviceList(data,filter,csrf);
 else if(section==='claims')content=claimsList(data,filter,csrf);
 else if(section==='roles')content=roleList(data,csrf);
 else if(section==='audit')content=auditList(data,filter);
 else if(section==='system')content=systemView(data);
 const notice=done?'<div class="adm-notice" role="status">تم تنفيذ الإجراء وتسجيله في سجل التدقيق بنجاح.</div>':'';
 return page(title,'<style>'+css+'</style><div class="adm-root">'+sidebar+'<div class="adm-main">'+hero+notice+content+'</div></div>',true);
}
