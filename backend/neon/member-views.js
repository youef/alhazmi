const publicSite = 'https://youef.github.io/alhazmi/';
const css = `
:root{color-scheme:light dark;--surface:#fff;--canvas:#f3f7f4;--text:#172c23;--muted:#50665b;--line:#d9e5de;--accent:#00633d;--soft:#e8f5ed;--header:#0f3e2c}
@media(prefers-color-scheme:dark){:root{--surface:#172a20;--canvas:#101b15;--text:#ecf8ef;--muted:#bdd0c3;--line:#355045;--accent:#98e3b2;--soft:#203d2c}}
*{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--text);font:16px/1.7 system-ui,Tahoma,sans-serif;min-height:100vh}
a{color:var(--accent)} header{background:var(--header);color:white}
nav{max-width:1140px;margin:auto;padding:14px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
nav a{color:inherit;text-decoration:none;padding-block:6px}nav>strong{margin-inline-end:auto;font-size:18px}nav form{margin:0}nav form button{background:transparent;border:1px solid #ffffff76;color:white}
main{max-width:1140px;margin:auto;padding:clamp(16px,4vw,36px) 20px 60px}
h1,h2,h3,p{margin:0}h1{font-size:clamp(1.65rem,4vw,2.5rem)}h2{font-size:1.25rem}h3{font-size:1rem}
.hero,.card,.auth-card{padding:clamp(18px,4vw,28px);border:1px solid var(--line);background:var(--surface);border-radius:17px}
.hero{margin-bottom:16px}.hero p,.card p,.auth-card p{color:var(--muted);margin-top:6px}
.auth-card{max-width:520px;margin:3vh auto}.auth-card h1{font-size:2rem}.auth-card form,.profile-form{display:grid;gap:12px;margin-top:18px}
label{display:grid;gap:4px;font-weight:650}
input{width:100%;min-height:44px;padding:8px 11px;background:var(--canvas);border:1px solid var(--line);border-radius:9px;color:var(--text);font:inherit}
button{font:inherit;font-weight:700;padding:8px 14px;min-height:42px;border-radius:9px;border:0;background:#00633d;color:white;cursor:pointer}
.tools{display:flex;gap:8px 15px;flex-wrap:wrap;margin-top:15px} .tools a{padding-block:6px}
.alert{padding:10px 13px;border-radius:8px;margin-top:12px;background:var(--soft);color:var(--text)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:12px;margin-block:12px 25px}
.tile{display:flex;flex-direction:column;gap:9px;text-decoration:none;color:var(--text)}.tile:hover{border-color:var(--accent)}.tile span{color:var(--accent);font-weight:700;font-size:.85rem}
.profile-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
dl{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:8px;margin:12px 0 0}dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere}
.records{display:grid;gap:10px}.records article{padding:14px 18px}
:where(a,button,input):focus-visible{outline:3px solid #c29643;outline-offset:3px}
`;

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
const e = escapeHtml;
export function page(title, content, signedIn = false) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${e(title)} | ديوان الحازمي</title><style>${css}</style></head>
<body><header><nav aria-label="التنقل"><strong>ديوان الحازمي</strong><a href="${publicSite}">الموقع العام</a>
${signedIn ? '<a href="/dashboard">لوحة التحكم</a><a href="/profile">الملف الشخصي</a><form method="post" action="/logout"><button type="submit">تسجيل الخروج</button></form>' : '<a href="/login">تسجيل الدخول</a>'}</nav></header>
<main>${content}</main></body></html>`;
}

export const moduleNames = {
  profile: 'سجل العضوية', tree: 'دليل النسب', family: 'الأسرة', requests: 'طلبات التغيير',
  serviceRequests: 'طلبات الخدمات', services: 'الخدمات المتاحة', documents: 'الوثائق المرتبطة',
  notifications: 'الإشعارات', activity: 'نشاط الحساب', membership: 'بطاقة العضوية',
  privacy: 'موافقات الخصوصية', claims: 'طلبات ربط الحساب', familySpaces: 'مساحات الأسرة',
  workItems: 'مهام الإشراف', genealogyReviews: 'مراجعات الأنساب', suggestions: 'ملاحظات جودة السجلات',
  familyTimeline: 'السجل الزمني للأسرة', forms: 'النماذج الإدارية', permissions: 'دليل الصلاحيات',
  roles: 'الأدوار', workflows: 'مسارات المراجعة', delegations: 'التفويضات',
  audit: 'سجل التدقيق', backups: 'حالة النسخ الاحتياطية',
};
const groups = [
  ['الأعضاء والأسرة', ['profile','tree','family','familyTimeline','familySpaces','requests','serviceRequests','services','documents','notifications','activity','membership','privacy','claims','delegations']],
  ['الإشراف ومراجعة الأنساب', ['workItems','genealogyReviews','suggestions','workflows']],
  ['إدارة النظام والصلاحيات', ['forms','permissions','roles','audit','backups']],
];

export function dashboard(user, modules) {
  const panels = groups.map(([label, keys]) => {
    const allowed = keys.filter(key => modules.includes(key));
    return allowed.length ? `<section><h2>${label}</h2><div class="grid">${allowed.map(key =>
      `<a class="tile card" href="/dashboard/${key}"><strong>${moduleNames[key]}</strong><span>عرض القسم ←</span></a>`).join('')}</div></section>` : '';
  }).join('');
  return page('لوحة التحكم', `<section class="hero"><h1>مرحبًا، ${e(user.name)}</h1><p>لوحة التحكم الخاصة بحسابك</p></section>
${panels || '<section class="card"><h2>حسابك جاهز</h2><p>يمكنك تعديل ملفك الشخصي. تُتاح خدمات العضوية بعد ربط الحساب بسجل معتمد وتفعيله من الإدارة.</p><div class="tools"><a href="/profile">فتح الملف الشخصي</a></div></section>'}`, true);
}

const fieldNames = {
  full_name_ar:'الاسم في سجل النسب', given_name_ar:'الاسم الأول', record_status:'حالة السجل',
  visibility:'مستوى الظهور', name_ar:'الاسم', title_ar:'العنوان', title:'العنوان',
  description_ar:'الوصف', description:'الوصف', unit_type:'نوع الوحدة', request_type:'نوع الطلب',
  status:'الحالة', state:'الحالة', category:'التصنيف', created_at:'أُنشئ في', reviewed_at:'رُوجع في',
  read_at:'قُرئ في', item_type:'نوع الوثيقة', review_status:'حالة المراجعة', event_code:'رمز الحدث',
  event_type:'نوع الحدث', event_kind:'نوع الحدث', outcome:'النتيجة', card_status:'حالة البطاقة',
  version:'الإصدار', issued_at:'أُصدرت في', expires_at:'تنتهي في', purpose:'الغرض',
  accepted_at:'تاريخ القبول', priority:'الأولوية', due_at:'الموعد', quality_state:'حالة الجودة',
  completeness_score:'اكتمال السجل', suggestion_kind:'نوع الملاحظة', detected_at:'رُصدت في',
  occurred_on:'التاريخ', module_key:'القسم', permission_key:'مفتاح الصلاحية', display_name_ar:'اسم الصلاحية',
  risk_level:'مستوى المخاطر', role_key:'مفتاح الدور', role_state:'حالة الدور', max_scope:'النطاق الأقصى',
  entity_type:'نوع السجل', scope:'النطاق', approved_at:'تاريخ الاعتماد', revoked_at:'تاريخ الإلغاء',
  backup_kind:'نوع النسخة', started_at:'البدء', completed_at:'الاكتمال', result:'النتيجة',
};

function itemView(item) {
  return Object.entries(item).filter(([key, value]) => Object.hasOwn(fieldNames, key) &&
    value != null && (typeof value !== 'object' || value instanceof Date))
    .map(([key, value]) => {
      const shown = value instanceof Date ? new Intl.DateTimeFormat('ar-SA', { dateStyle:'medium', timeZone:'Asia/Riyadh', calendar:'gregory' }).format(value) : value;
      return `<dt>${fieldNames[key]}</dt><dd>${e(shown)}</dd>`;
    }).join('');
}
export function modulePage(name, items) {
  return page(moduleNames[name], `<section class="hero"><h1>${moduleNames[name]}</h1><p>السجلات المتاحة وفق نطاق صلاحيتك</p></section>
${items.length ? `<div class="records">${items.map(item => `<article class="card"><dl>${itemView(item)}</dl></article>`).join('')}</div>`
  : '<section class="card"><p>لا توجد سجلات لعرضها في هذا القسم.</p></section>'}`, true);
}

const emailField = '<label>البريد الإلكتروني<input name="email" type="email" autocomplete="email" maxlength="254" required></label>';
const newPassword = '<label>كلمة المرور الجديدة<input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label>';
const authPages = {
  login: ['تسجيل الدخول', emailField + '<label>كلمة المرور<input name="password" type="password" autocomplete="current-password" maxlength="128" required></label>', 'دخول'],
  register: ['إنشاء حساب', '<label>الاسم الظاهر<input name="name" autocomplete="name" maxlength="100" required></label>' + emailField + newPassword, 'إنشاء الحساب'],
  verify: ['تأكيد البريد الإلكتروني', emailField + '<label>رمز التأكيد<input name="otp" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]{6}" required></label>', 'تأكيد البريد'],
  forgot: ['استعادة كلمة المرور', emailField, 'إرسال رابط الاستعادة'],
  reset: ['تعيين كلمة مرور جديدة', newPassword, 'حفظ كلمة المرور'],
};

export function authPage(kind, message = '', token = '', error = false) {
  const [title, fields, submit] = authPages[kind];
  return page(title, `<section class="auth-card"><h1>${title}</h1>
${message ? `<p class="alert" role="${error ? 'alert' : 'status'}">${e(message)}</p>` : ''}
<form method="post" action="/${kind}">${token ? `<input type="hidden" name="token" value="${e(token)}">` : ''}${fields}
<button type="submit">${submit}</button></form>
<div class="tools">${kind !== 'login' ? '<a href="/login">تسجيل الدخول</a>' : ''}
${kind !== 'register' ? '<a href="/register">إنشاء حساب</a>' : ''}
${kind !== 'verify' ? '<a href="/verify">تأكيد البريد</a>' : ''}
${kind !== 'forgot' ? '<a href="/forgot">نسيت كلمة المرور؟</a>' : ''}</div></section>`);
}

export function profilePage(user, status, notice = '', error = false) {
  return page('الملف الشخصي', `<section class="hero"><h1>الملف الشخصي</h1><p>إدارة بيانات الدخول والاسم الظاهر في الديوان</p></section>
${notice ? `<p class="alert" role="${error ? 'alert' : 'status'}">${e(notice)}</p>` : ''}
<div class="profile-grid"><section class="card"><h2>بيانات الحساب</h2>
<dl><dt>البريد الإلكتروني</dt><dd dir="ltr">${e(user.email)}</dd><dt>حالة العضوية</dt><dd>${e(status)}</dd></dl>
<form class="profile-form" method="post" action="/profile"><label>الاسم الظاهر<input name="name" value="${e(user.name)}" maxlength="100" required></label>
<button type="submit">حفظ الاسم</button></form></section>
<section class="card"><h2>تغيير كلمة المرور</h2><form class="profile-form" method="post" action="/profile/password">
<label>كلمة المرور الحالية<input name="currentPassword" type="password" autocomplete="current-password" maxlength="128" required></label>${newPassword}
<button type="submit">تحديث كلمة المرور</button></form></section></div>`, true);
}
