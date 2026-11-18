import { familyAdminContent } from './family-views.js';

import { escapeHtml as esc, page } from './member-views.js';
import { genealogyView } from './genealogy-admin-views.js';
const e=x=>esc(x??'');
const num=x=>new Intl.NumberFormat('ar-SA').format(Number(x||0));
const date=x=>x?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Riyadh'}).format(new Date(x)):'—';
const ICONS={
 overview:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
 members:'<circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2 M17 8a3 3 0 0 1 0 6 M18 16a5 5 0 0 1 4 4"/>',
 requests:'<path d="M7 3h10l4 4v14H7z M17 3v5h5 M10 13h7 M10 17h5"/>',
 services:'<path d="M3 8h18v13H3z M8 8V5a4 4 0 0 1 8 0v3 M3 13h18"/>',
 genealogy:'<path d="M12 3v4 M4 9h16 M4 9v5 M20 9v5 M2 14h5v7H2z M17 14h5v7h-5z M9 3h6v6H9z"/>',
 kinship:'<path d="M12 3v6 M5 9h14 M5 9v6 M19 9v6 M2 15h6v6H2z M16 15h6v6h-6z M9 3h6v6H9z"/>',
 claims:'<path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6z M9 12l2 2 4-4"/>',
 roles:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2 M20 5v5 M18 8h4"/>',
 audit:'<circle cx="11" cy="11" r="8"/><path d="m17 17 5 5 M8 11l2 2 4-4"/>',
 system:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h10 M7 13h10"/>',
};
const icon=(name,size=22)=>'<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[name]||ICONS.overview)+'</svg>';
const names={overview:'نظرة عامة',genealogy:'إدارة الأنساب والأفراد',members:'الأعضاء',kinship:'شجرة عائلتي',requests:'طلبات التغيير',services:'الخدمات',claims:'ربط السجلات',roles:'الأدوار والصلاحيات',supervisors:'مشرفو الأفخاذ والعائلات',audit:'سجل التدقيق',system:'حالة النظام'};
const navGroups=[
 ['السجل العائلي',['overview','genealogy','kinship']],
 ['العضوية والمعاملات',['members','services','claims','requests']],
 ['الحوكمة',['roles','supervisors','audit','system']],
];
const css=`
.adm-root{--a:#076a45;--b:#075138;--sub:#6a7c72;--bd:#deebe3;display:grid;grid-template-columns:230px minmax(0,1fr);gap:22px;align-items:start}
.adm-side{background:#fff;border:1px solid var(--bd);border-radius:20px;position:sticky;top:108px;padding:14px;box-shadow:0 14px 34px #06452a0a}
.adm-side-title{padding:12px 13px 18px;border-bottom:1px solid var(--bd);margin-bottom:12px;color:#074a30;font-weight:900}
.adm-nav{display:grid!important;max-width:none!important;gap:4px!important;padding:0!important}
.adm-nav a{display:flex!important;gap:11px;align-items:center;border-radius:11px;padding:11px 12px!important;color:#456354!important;font-size:.9rem!important;text-decoration:none;min-height:46px}
.adm-nav a[aria-current=page],.adm-nav a:hover{background:#e8f5ed!important;color:#075d3b!important;font-weight:850}
.adm-main{min-width:0}
.adm-hero{border-radius:23px;color:#fff;background:linear-gradient(115deg,#05432e,#08794d);padding:clamp(22px,4vw,36px);position:relative;overflow:hidden;box-shadow:0 16px 32px #03493222}
.adm-hero:before{display:none!important}\n.adm-hero:after{content:"";position:absolute;border-radius:50%;border:1px solid #ffffff33;width:260px;height:260px;inset-inline-end:-50px;top:-100px;box-shadow:0 0 0 42px #ffffff08,0 0 0 88px #ffffff09;pointer-events:none}
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
.adm-options input,.adm-form input[type=checkbox]{min-height:auto;width:17px;accent-color:var(--a)}
.adm-pagination{display:flex;flex-wrap:wrap;align-items:center;gap:10px;justify-content:space-between;margin-top:16px}
.adm-page-link{padding:7px 12px;border:1px solid var(--bd);border-radius:10px;text-decoration:none}
.adm-page-link:hover{background:#e9f7ee}
.adm-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
.adm-chiprow{display:flex;gap:7px;flex-wrap:wrap}
.adm-kv{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:10px 0;border-bottom:1px solid var(--bd);font-size:.88rem}
.adm-kv span:first-child{color:var(--sub)}
.adm-chip{background:#eff7f1;border-radius:8px;padding:5px 9px;font-size:.79rem}
.adm-family-layers{display:grid;gap:20px;margin:19px 0}.adm-family-level{padding:15px;border:1px dashed #b8dbca;border-radius:16px;background:#f8fcf9}.adm-family-level h3{margin:0 0 12px;font-size:.91rem;color:#376c50}.adm-person-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.adm-person{padding:15px;background:#fff;border:1px solid #dbeae1;border-radius:13px;min-width:0;box-shadow:0 4px 15px #0c472208}.adm-person strong{display:block;line-height:1.6;color:#0a593d;font-size:.94rem;overflow-wrap:anywhere}.adm-person-label{display:inline-block;font-size:.72rem;margin-bottom:7px;color:#668275}.adm-person-detail{font-size:.75rem;color:#62776b;margin-top:5px;overflow-wrap:anywhere}.adm-family-links{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.adm-family-link{font-size:.78rem;border-radius:99px;background:#e8f4ec;color:#226a47;padding:4px 9px}.adm-person small{font-size:.72rem;color:#5d7a6b}.adm-person-tag{background:#edf5f0;border-radius:8px;display:inline-block;margin-top:8px;padding:5px 8px;font-size:.75rem;color:#2c684a}
@media(max-width:900px){.adm-root{grid-template-columns:1fr}.adm-side{position:static;padding:10px}.adm-side-title{padding:8px 10px;margin-bottom:6px}.adm-nav{display:flex!important;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:thin}.adm-nav a{white-space:nowrap;flex:0 0 auto}.adm-two{grid-template-columns:1fr}}
@media(max-width:450px){.adm-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.adm-metric{padding:12px}.adm-metric strong{font-size:1.3rem}.adm-hero{padding:22px}}
@media(prefers-reduced-motion:reduce){.adm-root *{scroll-behavior:auto}}


/* Consistent Diwan administration layout across all management pages */
.adm-main{min-width:0;display:block}
.adm-main>.adm-crumbs{margin-block:3px 12px}
.adm-main>.adm-card,.adm-main>.gen-shell{max-width:100%}
.adm-side{overflow:hidden}
.adm-nav a:focus-visible{outline-offset:-3px}
.adm-side-title{font-size:1rem;letter-spacing:.01em}
.adm-nav a{position:relative;transition:background .15s ease,color .15s ease;min-height:48px}
.adm-nav a[aria-current=page]:before{content:"";position:absolute;inset-block:12px;inset-inline-start:0;width:3px;border-radius:6px;background:#08754e}
.adm-hero{display:flex;flex-direction:column;justify-content:center;min-height:175px}
.adm-genealogy .adm-hero{min-height:0;padding-block:18px}
.adm-genealogy .adm-hero h1{font-size:clamp(1.3rem,2.5vw,1.85rem)}
.adm-hero h1{display:flex;align-items:center;gap:11px;flex-wrap:wrap;line-height:1.3}
.adm-metrics{grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))}
.adm-metric{transition:transform .15s ease,box-shadow .15s ease}
.adm-metric:hover{transform:translateY(-2px);box-shadow:0 13px 30px #073d251c}
.adm-card,.adm-metric,.adm-detail{overflow-wrap:anywhere}
.adm-card{scroll-margin-top:20px}
.adm-tools{padding:13px 14px;border-radius:13px;background:#f1f7f3;border:1px solid #deebe3}
.adm-tools label{flex:1 1 220px;min-width:0}
.adm-tools :is(input,select){width:100%;min-width:0}
.adm-form :is(input,textarea,select){background:#ffffff;border-color:#b9cfc2;color:#17372a;transition:border-color .14s}
.adm-form textarea{min-height:100px;resize:vertical}
.adm-form :is(input,textarea,select):focus,.adm-tools :is(input,select):focus{outline:2px solid #08754e;outline-offset:1px}
.adm-button{background:#086846;min-height:45px;padding-inline:17px}
.adm-button:hover{background:#054b34}
.adm-detail{background:#f7fbf8;border-color:#deebe3}
.adm-detail summary{color:#075138}
.adm-note{background:#f1f7f3;border-color:#deebe3;color:#3c5c4d}
.adm-table-wrap{border:1px solid #deebe3;border-radius:14px}
.adm-table th{position:sticky;top:0;background:#edf5ef;z-index:1}
.adm-table tbody tr:nth-child(2n){background:#f8fbf9}
.adm-table tbody tr:hover{background:#e9f5ed}
.adm-pagination a{color:#075138}
.adm-badge.good{background:#e9f4e8;color:#317044}
.adm-badge.warn{background:#fff0d5;color:#9a692c}
.adm-badge.bad{background:#fae7e2;color:#a34d37}
.adm-root :is(a,button,summary,input,select,textarea):focus-visible{outline:3px solid #08754e;outline-offset:2px}
@media(max-width:850px){.adm-main>.adm-crumbs{padding-inline:3px}.adm-side{border-radius:14px}.adm-nav{scroll-snap-type:x proximity}.adm-nav a{scroll-snap-align:center}.adm-hero{min-height:145px}.adm-hero h1{font-size:1.4rem}}
@media(max-width:500px){.adm-card{padding:14px}.adm-tools{padding:11px}.adm-metric{min-height:110px}.adm-table{font-size:.78rem}.adm-table th,.adm-table td{padding:10px 8px}}
@media(prefers-reduced-motion:reduce){.adm-metric{transition:none}.adm-metric:hover{transform:none}}


.adm-root{grid-template-columns:218px minmax(0,1fr);gap:20px}
.adm-side{border-radius:16px;padding:12px}
.adm-side-title{margin-bottom:10px;padding-block:8px 12px}
.adm-nav-group{display:grid;gap:3px;margin-bottom:9px;min-width:0}
.adm-nav-group>span{font-size:.72rem;color:#536f60;padding:2px 12px;font-weight:750}
.adm-nav a{min-height:41px;padding-block:7px!important}
.adm-hero,.adm-genealogy .adm-hero{display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:16px;
 min-height:0;padding:clamp(18px,3.5vw,31px);border-radius:16px;background:#073e2b;border:1px solid #0e6547}
.adm-hero h1{font-size:clamp(1.35rem,3vw,1.95rem);line-height:1.35}
.adm-hero p{margin-top:4px}
.adm-page-icon{display:grid;place-items:center;width:50px;height:50px;flex:0 0 50px;border-radius:12px;background:#ffffff1c;color:#e4f4ea}
.adm-card,.adm-metric{border-radius:14px}
.adm-card .adm-topline{border-bottom:1px solid var(--bd);padding-bottom:10px}
.adm-table tbody tr{background:#fff}
.adm-root .family-index{display:flex;gap:8px;justify-content:flex-start;margin:0;padding:0}
.adm-root .family-index a{background:#e6f4eb;color:#075138;padding:7px 12px;border-radius:8px}
.adm-root .family-shell{--surface:#fff;--text:#17372a}
.adm-root .family-shell .family-card{scroll-margin-top:16px}
@media(max-width:900px){
 .adm-root{grid-template-columns:minmax(0,1fr)}
 .adm-nav-group{display:flex;gap:3px;margin:0}
 .adm-nav-group>span{display:none}
}
`;
const statusLabels={active:'نشط',pending:'بانتظار التفعيل',suspended:'موقوف',frozen:'مجمّد',archived:'مؤرشف',submitted:'مقدّم',triage:'فرز',needs_evidence:'يتطلب مستندات',approved:'معتمد',rejected:'مرفوض',draft:'مسودة',retired:'مؤرشف',review:'قيد المراجعة',in_review:'قيد المراجعة',completed:'مكتمل',cancelled:'ملغى'};
const status=v=>{
 const type=['active','approved','completed','success'].includes(v)?'good':['rejected','suspended','frozen','archived','failed'].includes(v)?'bad':['submitted','triage','needs_evidence','pending','review','in_review'].includes(v)?'warn':'';
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
 const url=p=>'/admin/'+section+'?'+new URLSearchParams(Object.entries({...filter,page:p}).filter(([,value])=>value));
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
 return metrics+'<div class="adm-two">'+card('آخر طلبات التغيير',recent,'<a class="adm-link" href="/admin/requests">عرض الكل</a>')+card('آخر أحداث التدقيق',events,'<a class="adm-link" href="/admin/audit">عرض السجل</a>')+'</div>'+card('إجراءات سريعة','<div class="adm-chiprow"><a class="adm-button ghost" href="/admin/genealogy">إضافة الأفراد والأفخاذ والعوائل</a><a class="adm-button ghost" href="/admin/members">إدارة الأعضاء</a><a class="adm-button ghost" href="/admin/requests">مراجعة الطلبات</a><a class="adm-button ghost" href="/admin/roles">الأدوار والصلاحيات</a><a class="adm-button ghost" href="/admin/system">مراقبة النظام</a></div>');
}
function memberList(data,filter,csrf){
 const options=(items,selected)=>items.map(item=>'<option value="'+e(item.id)+'"'+(selected===item.id?' selected':'')+'>'+e(item.name_ar)+'</option>').join('');
 const choice=(title,key,items,selected)=>'<label>'+title+'<select name="'+key+'"><option value="">الكل</option>'+options(items,selected)+'</select></label>';
 const scopeSearch='<form method="get" action="/admin/members" class="adm-tools">'+
  choice('١. الفخذ','fakhth',data.fakhths||[],filter.fakhth)+
  (filter.fakhth?choice('٢. العائلة','family',data.families||[],filter.family):'')+
  '<label>'+(filter.fakhth?'٣. اسم الفرد أو بريده':'اسم العضو أو بريده')+'<input type="search" name="q" value="'+e(filter.q)+'" maxlength="80"></label>'+
  '<label>حالة العضوية<select name="status"><option value="">الكل</option>'+
  ['active','pending','frozen','suspended','archived'].map(key=>'<option value="'+key+'"'+(key===filter.status?' selected':'')+'>'+statusLabels[key]+'</option>').join('')+
  '</select></label><button class="adm-button" type="submit">بحث</button><a class="adm-link" href="/admin/members">مسح الفلاتر</a></form>';
 const identitySearch=data.canIdentity?'<details class="adm-detail"'+(data.identityResult?' open':'')+'><summary>بحث برقم الهوية الوطنية</summary>'+
  form('members',csrf,'lookup_member_identity',h('identifier_type','national_id')+
   '<label>رقم الهوية<input type="password" name="identity" inputmode="numeric" maxlength="20" autocomplete="off" required></label>','مطابقة الهوية')+
  (data.identityResult?'<p class="adm-note" role="status">'+(data.identityResult.matched?'تطابق مع '+e(data.identityResult.record.full_name_ar)+' · '+e(data.identityResult.record.masked_value):'لم يتم العثور على هوية مطابقة.')+'</p>':'')+'</details>':'';
 const assignments=new Map();
 for(const assignment of data.assignments||[]){
  if(!assignments.has(assignment.user_id))assignments.set(assignment.user_id,[]);
  assignments.get(assignment.user_id).push(assignment);
 }
 const cards=data.rows.map(u=>{
  const allowed=u.id&&u.verified&&!u.banned&&!u.is_admin&&u.id!==data.actorId;
  const confirmation='<label class="adm-chiprow"><span><input type="checkbox" name="confirm" value="yes" required> أؤكد الإجراء</span></label>';
  const wrap=(name,body)=>'<details class="adm-detail"><summary>'+name+'</summary>'+body+'</details>';
  const edit=allowed&&data.canManage?wrap('تعديل العضو',form('members',csrf,'edit_member',h('id',u.id)+
   '<label>اسم العرض الإداري<input name="display_name" value="'+e(u.display_name||u.name||u.full_name_ar)+'" required minlength="3" maxlength="100"></label>')):'';
  const lifecycle=allowed&&data.canManage?wrap('تفعيل أو تجميد أو إيقاف',form('members',csrf,'change_member',h('id',u.id)+
   '<label>الحالة الجديدة<select name="state" required><option value="">اختر</option>'+
   [['active','تفعيل'],['frozen','تجميد'],['suspended','إيقاف']].map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join('')+
   '</select></label>'+confirmation,'تطبيق الحالة')):'';
  const archive=allowed&&data.canManage&&u.account_status!=='archived'?wrap('إزالة العضوية',form('members',csrf,'change_member',h('id',u.id)+h('state','archived')+
   '<p class="adm-note">تؤرشف العضوية ويُلغى تفويضها. يبقى سجل النسب وسجل التدقيق محفوظين.</p>'+confirmation,'أرشفة العضوية',true)):'';
  const add=!u.id&&u.record_status==='verified'&&data.canLink?wrap('إضافة العضو بربط حساب مؤكّد',form('members',csrf,'add_member',h('person',u.person_id)+
   '<label>بريد حساب العضو<input name="email" type="email" maxlength="254" required></label><label>دليل المطابقة وملاحظات المراجعة<textarea name="note" required minlength="10" maxlength="600"></textarea></label>','ربط العضوية وتفعيلها')):'';
  const scope=allowed&&data.canAssign&&u.account_status==='active'&&u.record_status==='verified'&&u.fakhth_unit_id?wrap('تعيين الإشراف والصلاحيات',form('members',csrf,'grant_member_scope',h('id',u.id)+
   '<label>نوع الإشراف<select name="scope" required><option value="">اختر</option><option value="family">مشرف العائلة</option><option value="fakhth">مشرف الفخذ</option><option value="parent">مشرف ذريته</option><option value="family_leader">قائد العائلة</option><option value="fakhth_leader">قائد الفخذ</option></select></label>'+
   '<label>مدة التفويض<select name="duration_days"><option value="30">٣٠ يومًا</option><option value="90" selected>٩٠ يومًا</option><option value="365">سنة</option></select></label>'+
   '<p class="adm-note">يحدد النظام النطاق من العائلة والفخذ المرتبطين بسجل العضو.</p>','منح الصلاحية')):'';
  const custom=scope&&data.customRoles?.length?wrap('منح دور مخصص على مستوى القبيلة',form('members',csrf,'grant_member_scope',
   h('id',u.id)+h('scope','custom')+'<label>الدور<select name="custom_role" required><option value="">اختر</option>'+
   options(data.customRoles)+'</select></label><label>المدة<select name="duration_days"><option value="30">٣٠ يومًا</option><option value="90">٩٠ يومًا</option><option value="365">سنة</option></select></label>','منح الدور')):'';
  const granted=allowed&&data.canAssign&&assignments.has(u.id)?wrap('التفويضات السارية',assignments.get(u.id).map(a=>
   '<p>'+e(a.name_ar)+(a.scope_name?' · '+e(a.scope_name):'')+'</p>'+
   form('members',csrf,'revoke_member_scope',h('member',u.id)+h('id',a.id)+confirmation,'إلغاء التفويض',true)).join('')):'';
  const lineage=[u.fakhth_name,u.family_name,u.full_name_ar].filter(Boolean).map(e).join(' ← ');
  return '<article class="adm-card"><div class="adm-topline"><h2>'+e(u.display_name||u.name||u.full_name_ar||'عضو')+'</h2>'+
   (u.is_admin?'<span class="adm-badge good">حساب إداري محمي</span>':u.id?status(u.account_status):'<span class="adm-badge">فرد بلا حساب مرتبط</span>')+'</div>'+
   (u.email?'<p class="adm-muted"><bdi>'+e(u.email)+'</bdi> · '+(u.verified?'بريد مؤكّد':'بريد غير مؤكّد')+'</p>':'')+
   (lineage?'<p>'+lineage+'</p>':'')+edit+lifecycle+scope+custom+granted+add+archive+'</article>';
 });
 return card('سجل الأعضاء والصلاحيات',scopeSearch+identitySearch+
  '<div class="adm-chiprow"><a class="adm-link" href="/admin/genealogy?view=create#gen-tree-create">إضافة سجل فرد</a>'+
  '<a class="adm-link" href="/admin/supervisors">دعوات الإشراف</a><a class="adm-link" href="/admin/roles">إدارة الأدوار المخصصة</a></div>')+
  (cards.join('')||empty('لا توجد نتائج','جرّب اسمًا آخر أو اختر فخذًا وعائلة.'))+pager('members',filter,data);
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
 const backdrop=data.backlog.map(r=>{
  const inProgress=['submitted','in_review','needs_evidence','approved'].includes(r.state);
  const choices=r.state==='approved'?'<option value="completed">تم تنفيذ الخدمة</option>':'<option value="in_review">قيد المراجعة</option><option value="needs_evidence">طلب إثبات</option><option value="approved">اعتماد القرار</option><option value="rejected">رفض الطلب</option>';
  const actions=inProgress?'<details class="adm-detail"><summary>مراجعة الطلب</summary>'+form('services',csrf,'review_service',h('id',r.id)+h('expected',r.state)+'<label>القرار<select name="next">'+choices+'</select></label><label>ملاحظات القرار<textarea name="note" minlength="10" maxlength="500" rows="2" required></textarea></label>','تسجيل قرار الخدمة')+'</details>':'<span class="adm-muted">مغلق</span>';
  return tr([e(r.title_ar||'خدمة'),e(r.email||'عضو'),status(r.state),rowTime(r.created_at),actions]);
 });
 const creation=form('services',csrf,'create_service','<label>عنوان الخدمة<input name="title" maxlength="120" minlength="3" placeholder="مثال: إصدار شهادة عضوية" required></label><label>مفتاح الخدمة<input name="key" dir="ltr" placeholder="members.certificate" pattern="[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+" maxlength="90" required></label><label>الوصف<textarea name="description" rows="3" maxlength="600"></textarea></label><label>مستوى الوصول<select name="visibility"><option value="authenticated">كل عضو مسجل</option><option value="authorized_family">أفراد الأسرة المخوّلون</option><option value="admins">الإدارة فقط</option></select></label><p class="adm-note">ستُنشأ الخدمة كمسودة ولا تُنشر حتى تعتمدها.</p>','إنشاء الخدمة');
 return card('كتالوج الخدمات',filters('services',filter,['draft','active','retired'])+table(['الخدمة','الحالة','الظهور','التاريخ','النشر'],rows)+pager('services',filter,data))
  +card('أحدث طلبات الخدمات',table(['الخدمة','مقدم الطلب','الحالة','التاريخ','المراجعة'],backdrop))
  +card('إنشاء خدمة جديدة',creation);
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
 const assign=canAssign?form('roles',csrf,'grant_role','<label>الدور<select name="role" required>'+roleOptions+'</select></label><label>الحساب<select name="target" required>'+members+'</select></label><label>النطاق القبلي<select name="tribe" required>'+tribes+'</select></label><label>مدة التفويض<select name="duration_days"><option value="90">90 يومًا</option><option value="30">30 يومًا</option><option value="365">سنة</option></select></label>','منح الدور'):'<p class="adm-note">يلزم إنشاء دور مخصص مع وجود مستخدم مؤكد وقبيلة معتمدة قبل منح الصلاحية.</p>';
 const permitted=data.permissions.map(p=>'<label><input type="checkbox" name="permission" value="'+e(p.id)+'"><span>'+e(p.display_name_ar||p.permission_key)+' <small class="adm-muted" dir="ltr">'+e(p.permission_key)+'</small></span></label>').join('');
 const create=form('roles',csrf,'create_role','<label>اسم الدور بالعربية<input name="name" required minlength="3" maxlength="100" placeholder="مثال: مشرف الطلبات"></label><label>مفتاح الدور بالإنجليزية<input name="key" required pattern="[a-z][a-z0-9_-]{1,63}" maxlength="64" placeholder="requests_supervisor" dir="ltr"></label><p class="adm-note">صلاحيات عادية وحساسة فقط؛ صلاحيات النظام الحرجة لا يمكن تفويضها من هذه الواجهة.</p><div class="adm-options">'+permitted+'</div>','إنشاء دور معتمد');
 const assigned=data.assignments.map(a=>tr([e(a.email),e(a.name_ar),e(a.scope_type)+'<div class="adm-muted">حتى '+date(a.expires_at)+'</div>',rowTime(a.approved_at),a.is_system?'<span class="adm-badge good">محمي</span>':form('roles',csrf,'revoke_role',h('id',a.id)+'<label><input type="checkbox" name="confirm" value="yes" required> أؤكد الإلغاء</label>','سحب التفويض',true)]));
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

function kinshipView(data) {
 const all=data.people||[], byId=new Map(all.map(p=>[p.id,p]));
 const root=byId.get(data.viewerId);
 if(!root)return card('شجرة عائلتي',empty('لم يُربط الحساب بسجل شخصي بعد','يلزم ربط حسابك بسجل عائلي خاص لتظهر الشجرة هنا.'));
 const parent=(person,side)=>person?byId.get(person[side+'_id']):null;
 const father=parent(root,'father'),mother=parent(root,'mother');
 const gfather=parent(father,'father'),gmother=parent(father,'mother'),mf=parent(mother,'father'),mm=parent(mother,'mother');
 const spouses=person=>person?data.marriages.filter(m=>m.partner_a_id===person.id||m.partner_b_id===person.id)
   .map(m=>byId.get(m.partner_a_id===person.id?m.partner_b_id:m.partner_a_id)).filter(Boolean):[];
 const children=person=>person?all.filter(p=>p.father_id===person.id||p.mother_id===person.id):[];
 const siblings=person=>person?all.filter(p=>p.id!==person.id &&
   (person.father_id&&p.father_id===person.father_id || person.mother_id&&p.mother_id===person.mother_id)):[];
 const brothers=person=>siblings(person).filter(p=>p.gender==='male');
 const sisters=person=>siblings(person).filter(p=>p.gender==='female');
 const paternalUncles=brothers(father),maternalUncles=brothers(mother);
 const paternalAunts=sisters(father),maternalAunts=sisters(mother);
 const brothersOfSelf=siblings(root);
 const kids=children(root);
 const spouse=spouses(root);
 const personCard=(p,label)=>{
  if(!p)return '<div class="adm-person"><span class="adm-person-label">'+e(label)+'</span><strong class="adm-muted">لا يوجد سجل حتى الآن</strong></div>';
  const facts=[p.family_name?'العائلة: '+p.family_name:'',p.birth_place?'الميلاد: '+p.birth_place:'',
    p.residence?'السكن: '+p.residence:'',p.retired?'متقاعد':''].filter(Boolean);
  return '<div class="adm-person"><span class="adm-person-label">'+e(label)+'</span><strong>'+e(p.full_name_ar)+'</strong><div class="adm-family-links">'+facts.map(x=>'<span class="adm-family-link">'+e(x)+'</span>').join('')+'</div>'+
   (p.biography?'<details><summary class="adm-link">التفاصيل المحفوظة</summary><p class="adm-person-detail">'+e(p.biography)+'</p></details>':'')+
   '<small>خاص • '+e(p.record_status==='under_review'?'تحت المراجعة':p.record_status)+'</small></div>';
 };
 const level=(title,people)=>'<section class="adm-family-level"><h3>'+e(title)+'</h3><div class="adm-person-grid">'+people.map(([p,label])=>personCard(p,label)).join('')+'</div></section>';
 const generation1=level('الجيل الأول — الأجداد',[[gfather,'الجد من جهة الأب'],[gmother,'الجدة من جهة الأب'],[mf,'الجد من جهة الأم'],[mm,'الجدة من جهة الأم']]);
 const generation2=level('الجيل الثاني — الأب والأم',[[father,'الأب'],[mother,'الأم']]);
 const generation3=level('الجيل الثالث — صاحب الحساب والأسرة',[[root,'صاحب الحساب'],...spouse.map(p=>[p,p.gender==='female'?'الزوجة':'الزوج']),...brothersOfSelf.map(p=>[p,p.gender==='female'?'الأخت':'الأخ'])]);
 const generation4=level('الجيل الرابع — الأبناء',kids.length?kids.map(p=>[p,p.gender==='female'?'الابنة':'الابن']):[[null,'الأبناء']]);
 const relatives=(arr,none)=>arr.length?'<div class="adm-family-links">'+arr.map(p=>'<span class="adm-family-link">'+e(p.full_name_ar)+'</span>').join('')+'</div>':'<p class="adm-muted">'+e(none)+'</p>';
 const uncleContent='<div class="adm-two">'+
  '<div><h3>الأعمام — إخوة الأب</h3>'+relatives(paternalUncles,'لم تُسجّل أسماء الأعمام بعد.')+
  '<h3>العمّات — أخوات الأب</h3>'+relatives(paternalAunts,'لم تُسجّل أسماء العمّات بعد.')+'</div>'+
  '<div><h3>الأخوال — إخوة الأم</h3>'+relatives(maternalUncles,'لم تُسجّل أسماء الأخوال بعد.')+
  '<h3>الخالات — أخوات الأم</h3>'+relatives(maternalAunts,'لم تُسجّل أسماء الخالات بعد.')+'</div></div>';
 const details=table(['الاسم','العائلة','الأب','الأم','الخصوصية'],all.map(p=>tr([
   '<strong>'+e(p.full_name_ar)+'</strong>',e(p.family_name||'غير محددة'),
   e(byId.get(p.father_id)?.given_name_ar||'غير مسجل'),
   e(byId.get(p.mother_id)?.given_name_ar||'غير مسجلة'),
   status(p.record_status)
 ])));
 return card('تسلسل النسب والأجيال','<p class="adm-note">العلاقات تستخرج مباشرة من روابط الأب والأم والزواج داخل Neon، وتتغير تلقائيًا كلما أُضيفت سجلات جديدة. جميع بيانات الأحياء والأطفال خاصة وبحاجة لمراجعة.</p>'+
   '<div class="adm-family-layers">'+generation1+generation2+generation3+generation4+'</div>')+
  card('الأعمام والعمّات والأخوال والخالات',uncleContent+
   '<p class="adm-note">لا يمكن تحديد عم أو خال بالاسم ما لم يُسجّل هو وأبوه أو أمه بصلات القرابة الصحيحة.</p>')+
  card('دليل أفراد هذه العائلة',details);
}

export function adminView(section,user,data,filter,csrf,done=false){
 const title=names[section]||'الإدارة';
 const sidebar='<aside class="adm-side"><div class="adm-side-title">إدارة الديوان</div>'+
  '<nav class="adm-nav" aria-label="أقسام الإدارة">'+navGroups.map(([label,sections])=>
   '<div class="adm-nav-group"><span>'+label+'</span>'+sections.map(k=>'<a href="/admin/'+k+'"'+
    (k===section?' aria-current="page"':'')+'>'+icon(k,20)+e(names[k])+'</a>').join('')+'</div>').join('')+'</nav></aside>';

 const descriptions={
  overview:'حالة العضويات والسجلات والطلبات ومسارات العمل.',
  genealogy:'إدارة الأفراد والأصول والقرابة ومصادر التوثيق.',
  kinship:'الوالدان والأجداد والأبناء والقرابة المرتبطة بحسابك.',
  members:'البحث عن الأفراد وإدارة العضوية والتفويضات.',
  services:'إدارة الخدمات ومراجعة المعاملات المقدّمة.',
  claims:'مطابقة حسابات الأعضاء مع سجلات الأفراد الموثّقة.',
  requests:'مراجعة طلبات التغيير والأدلة واتخاذ القرار.',
  roles:'إدارة الأدوار المخصصة ومنح الصلاحيات ومراجعتها.',
  supervisors:'تعيين مشرفي الأفخاذ والعائلات ومراجعة طلبات القرابة.',
  audit:'تتبّع الإجراءات والقرارات الإدارية.',system:'مراقبة بيانات التشغيل الأساسية.',
 };
 const hero='<div class="adm-crumbs"><a href="/dashboard">خدماتي</a><span aria-hidden="true"> / </span><a href="/admin">الإدارة</a></div>'+
  '<header class="adm-hero"><span class="adm-page-icon" aria-hidden="true">'+icon(section,25)+'</span><div><h1>'+e(title)+'</h1>'+
  '<p>'+e(descriptions[section]||'')+'</p></div></header>';
 let content='';
 if(section==='overview')content=home(data);
 else if(section==='genealogy')content=genealogyView(data,csrf);
 else if(section==='kinship')content=kinshipView(data);
 else if(section==='members')content=memberList(data,filter,csrf);
 else if(section==='requests')content=requestList(data,filter,csrf);
 else if(section==='services')content=serviceList(data,filter,csrf);
 else if(section==='claims')content=claimsList(data,filter,csrf);
 else if(section==='supervisors')content=familyAdminContent(data,csrf);
 else if(section==='roles')content=roleList(data,csrf);
 else if(section==='audit')content=auditList(data,filter);
 else if(section==='system')content=systemView(data);
 const notice=done?'<div class="adm-notice" role="status">تم تنفيذ الإجراء وتسجيله في سجل التدقيق بنجاح.</div>':'';
 return page(title,'<style>'+css+'</style><div class="adm-root'+(section==='genealogy'?' adm-genealogy':'')+'">'+sidebar+'<div class="adm-main">'+hero+notice+content+'</div></div>',true,{serviceLayout:true});
}
