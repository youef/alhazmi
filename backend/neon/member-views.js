const publicSite = 'https://youef.github.io/alhazmi/';
const css = `
:root{color-scheme:light dark;--surface:#fff;--canvas:#f3f7f4;--text:#172c23;--muted:#50665b;--line:#d9e5de;--accent:#00633d;--soft:#e8f5ed;--header:#0f3e2c}
@media(prefers-color-scheme:dark){:root{--surface:#172a20;--canvas:#101b15;--text:#ecf8ef;--muted:#bdd0c3;--line:#355045;--accent:#98e3b2;--soft:#203d2c}}
*{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--text);font:16px/1.7 system-ui,Tahoma,sans-serif;min-height:100vh}
a{color:var(--accent)} header{background:var(--header);color:white}
nav{max-width:1140px;margin:auto;padding:14px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
nav a{color:inherit;text-decoration:none;padding-block:6px}nav .brand{margin-inline-end:auto;font-size:18px;font-weight:800}nav form{margin:0}nav form button{background:transparent;border:1px solid #ffffff76;color:white}
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
nav a,nav form button{min-height:44px;display:inline-flex;align-items:center}
.member-hero{display:grid;gap:16px;padding:clamp(20px,5vw,44px);margin-bottom:17px;background:linear-gradient(125deg,#004a30,#076846);color:#fff;border-radius:18px}
.member-hero p{color:#e5f6eb;margin-top:6px}
.member-hero .status{display:inline-flex;align-items:center;gap:7px;background:#ffffff20;border:1px solid #ffffff65;color:white;border-radius:99px;padding:5px 12px;width:fit-content;font-size:.85rem}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.action-link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:7px 15px;border-radius:9px;background:#00633d;color:white;text-decoration:none;font-weight:700}
.member-hero .action-link{background:#f5dfa8;color:#263624}
.action-link.secondary{background:var(--soft);color:var(--accent)}
.overview{display:grid;gap:13px;margin-bottom:17px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.overview .card{padding:16px 20px}
.overview h2{font-size:1rem}
.overview .value{font-size:1.15rem;font-weight:800;color:var(--accent)}
.tile-icon{display:grid;place-items:center;background:var(--soft);color:var(--accent);width:40px;height:40px;border-radius:10px}
.tile-icon svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.section-heading{display:flex;flex-wrap:wrap;align-items:center;gap:10px;justify-content:space-between;margin-top:18px}
.remember{display:flex;align-items:center;gap:9px;font-size:.9rem;min-height:44px}
.remember input{width:19px;min-height:19px;accent-color:#087047}
.auth-card small{display:block;color:var(--muted)}
:where(a,button,input):focus-visible{outline:3px solid #c29643;outline-offset:3px}
`;

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
const e = escapeHtml;
export function page(title, content, signedIn = false) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${e(title)} | ديوان الحازمي</title><style>${css}</style></head>
<body><header><nav aria-label="التنقل"><a class="brand" href="/">ديوان الحازمي</a><a href="/">الرئيسية</a><a href="${publicSite}">الموقع العام</a>
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

const glyphs = {
  members: '<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v2"/>',
  review: '<path d="M5 4h14v16H5z M8 12l3 3 5-6"/>',
  system: '<path d="M12 3l8 4v6c0 4-4 7-8 9-4-2-8-5-8-9V7z M9 12l2 2 4-4"/>',
};
const badge = status => `<span class="status">${e(status)}</span>`;
const icon = key => `<span class="tile-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24">${glyphs[key]}</svg></span>`;

export function memberHome(user, status) {
  return page('الرئيسية', `<section class="member-hero">
    <div><h1>بوابة ديوان الحازمي</h1><p>${user ? `مرحبًا، ${e(user.name)}` : 'ادخل إلى حسابك للاطلاع على خدمات العضوية والأقسام المتاحة لك.'}</p></div>
    ${user ? badge(status) : ''}
    <div class="actions">${user
      ? '<a class="action-link" href="/dashboard">لوحة التحكم</a><a class="action-link secondary" href="/profile">الملف الشخصي</a>'
      : '<a class="action-link" href="/login">تسجيل الدخول</a><a class="action-link secondary" href="/register">إنشاء حساب</a>'}</div>
  </section>
  <section class="overview">
    <a class="card tile" href="${publicSite}ar/branches/">${icon('members')}<strong>دليل الأفخاذ والعوائل</strong><p>تصفّح الوحدات المعتمدة للنشر.</p></a>
    <a class="card tile" href="${publicSite}ar/lineage/">${icon('review')}<strong>شجرة النسب</strong><p>استكشف تسلسل الفروع والعوائل.</p></a>
    <a class="card tile" href="${publicSite}ar/archive/">${icon('system')}<strong>الوثائق والموروث</strong><p>اطّلع على الأرشيف العام.</p></a>
  </section>`, Boolean(user));
}

export function dashboard(user, modules, status) {
  const groupIcons = ['members', 'review', 'system'];
  const panels = groups.map(([label, keys], index) => {
    const allowed = keys.filter(key => modules.includes(key));
    return allowed.length ? `<section><div class="section-heading"><h2>${label}</h2></div><div class="grid">${allowed.map(key =>
      `<a class="tile card" href="/dashboard/${key}">${icon(groupIcons[index])}<strong>${moduleNames[key]}</strong><span>فتح القسم ←</span></a>`).join('')}</div></section>` : '';
  }).join('');
  return page('لوحة التحكم', `<section class="member-hero"><div><h1>لوحة التحكم</h1><p>مرحبًا، ${e(user.name)}</p></div>${badge(status)}
    <div class="actions"><a class="action-link" href="/profile">الملف الشخصي</a><a class="action-link secondary" href="/">رئيسية البوابة</a></div>
  </section>
  <section class="overview" aria-label="نظرة عامة على الحساب">
    <div class="card"><h2>حالة العضوية</h2><p class="value">${e(status)}</p></div>
    <div class="card"><h2>الأقسام المتاحة لك</h2><p class="value">${new Intl.NumberFormat('ar-SA').format(modules.length)}</p></div>
  </section>
  ${panels || '<section class="card"><h2>ربط العضوية</h2><p>تُتاح خدمات العضوية بعد ربط الحساب بسجل معتمد وتفعيله من الإدارة. ملفك الشخصي متاح الآن.</p></section>'}`, true);
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
  login: ['تسجيل الدخول', emailField + '<label>كلمة المرور<input name="password" type="password" autocomplete="current-password" maxlength="128" required></label><label class="remember"><input type="checkbox" name="rememberMe" value="yes" checked> تذكّر دخولي على هذا الجهاز</label><small>ألغِ التحديد إذا كنت تستخدم جهازًا مشتركًا.</small>', 'دخول'],
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
