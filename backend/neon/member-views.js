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

/* Diwan design system: government-service inspired, independent identity */
[hidden]{display:none!important}
:root{--canvas:#f3f6f5;--surface:#fff;--text:#16372b;--muted:#62746b;--line:#dce8e1;--accent:#006b45;--soft:#e8f5ee;--header:#06452f;--gold:#c8a35d}
body{font-family:Tahoma,"Segoe UI",system-ui,sans-serif;line-height:1.8}
header{background:#fff;color:#183a2c;border-bottom:1px solid var(--line);box-shadow:0 2px 14px #0b382b09;position:sticky;top:0;z-index:10}
header:before{content:"";display:block;height:5px;background:linear-gradient(90deg,#0a6e49,#d5b56c,#0a6e49)}
nav{max-width:1250px;gap:5px 12px;padding:10px 20px}
nav .brand{display:flex;align-items:center;gap:10px;color:#064a30;font-weight:900;font-size:1.14rem}
.brand-mark{width:43px;height:43px;display:grid;place-items:center;border-radius:13px;color:#fff;background:#086343}
.brand-mark svg{width:24px;height:24px}
nav a:not(.brand){border-radius:9px;padding:7px 11px;font-weight:650;color:#3c5649;font-size:.9rem}
nav a:hover,nav a[aria-current]{background:#e9f6ef;color:#065f3c}
nav form button{border-color:#d7e5dc;color:#9a2c2c;padding:5px 12px}
main{max-width:1250px;padding-top:26px}
h1,h2,h3{letter-spacing:-.02em}
.hero,.card,.auth-card{box-shadow:0 5px 30px #0a342b08;border-radius:17px}
.member-hero{border-radius:23px;position:relative;overflow:hidden;background:linear-gradient(112deg,#06432e,#087850 85%);box-shadow:0 18px 35px #03462b26}
.member-hero:after{content:"";position:absolute;inset-inline-end:-50px;inset-block-end:-100px;width:300px;height:300px;border:1px solid #ffffff32;border-radius:50%;box-shadow:0 0 0 55px #ffffff08,0 0 0 105px #ffffff07;pointer-events:none}
.member-hero>*{position:relative;z-index:1}
.member-hero h1{font-size:clamp(1.9rem,4vw,2.65rem)}
.member-hero .status{border-color:#ffffff40}
.action-link{border-radius:11px;transition:transform .15s,box-shadow .15s}
.action-link:hover{transform:translateY(-2px);box-shadow:0 8px 16px #032c1c26}
.member-hero .action-link.secondary{background:#ffffff22;color:#fff;border:1px solid #ffffff55}
.overview{grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))}
.overview .card{border-inline-start:4px solid #08704c}
.overview .value{font-size:1.5rem}
.grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,225px),1fr));gap:14px}
.tile{min-height:154px;gap:8px;transition:transform .16s,border-color .16s,box-shadow .16s}
.tile:hover{transform:translateY(-3px);box-shadow:0 11px 23px #08422b16}
.tile strong{font-size:1.02rem}
.tile-icon{width:48px;height:48px;border-radius:14px}
.tile-icon svg{width:25px;height:25px}
.section-heading{margin:24px 0 10px}
.section-heading h2{font-size:1.25rem}
.section-heading small{color:var(--muted)}
.page-tools{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 0 20px}
.search-field{display:flex;align-items:center;gap:8px;min-width:min(100%,280px);flex:1;max-width:520px;background:var(--surface);border:1px solid var(--line);border-radius:13px;padding-inline:13px}
.search-field input{background:transparent;border:0;outline:none;min-width:0}
.search-field:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px #087b4920}
.search-field svg{width:20px;height:20px;color:var(--accent)}
.search-empty{display:none;padding:25px;text-align:center;color:var(--muted)}
.auth-card{margin:5vh auto;overflow:hidden;position:relative}
.auth-card:before{content:"";height:5px;display:block;position:absolute;top:0;right:0;left:0;background:linear-gradient(90deg,#076e47,#d1ad6e)}
.auth-card button,.profile-form button{background:#006a43}
.auth-card button:hover,.profile-form button:hover{background:#075638}
.auth-card input:not([type=checkbox]),.profile-form input{border-radius:11px}
.auth-card h1{color:var(--accent)}
.records article:hover{border-color:var(--accent)}
.section-caption{font-size:.85rem;color:var(--muted)}
@media(max-width:650px){nav{gap:2px 5px}nav .brand{width:100%;margin-bottom:5px}nav a:not(.brand){font-size:.8rem;padding-inline:8px}nav form button{font-size:.8rem}.member-hero{padding:24px}.overview .value{font-size:1.2rem}main{padding-inline:14px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.tile{padding:13px;min-height:140px}.tile strong{font-size:.88rem}.tile-icon{width:40px;height:40px}.tile-icon svg{width:21px;height:21px}}
@media(max-width:360px){.grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.tile,.action-link{transition:none}.tile:hover,.action-link:hover{transform:none}}


/* Warm heritage design shared with the public diwan */
:root{color-scheme:light;--surface:#fffdfa;--canvas:#f5f1eb;--text:#38291f;--muted:#8b7667;--line:#e6dbcc;--accent:#a55339;--soft:#f5e8db;--header:#30251c;--gold:#c2965d}
body{background:var(--canvas);color:var(--text)}
header{background:#30251c;color:#fff4e5;border-bottom:3px solid #b77c51}
header:before{background:linear-gradient(90deg,#a55339,#e5bb86,#a55339)}
header nav a,header nav .brand{color:#fff1dd}
main{max-width:1450px}.hero,.card,.auth-card,.tile{background:var(--surface);border-color:var(--line);border-radius:18px;box-shadow:0 10px 30px #44281811}
.member-hero{background:linear-gradient(115deg,#2d211b 10%,#603c29 60%,#a15a3b);border:1px solid #ae754e;border-radius:21px;min-height:210px;position:relative;overflow:hidden}
.member-hero:after{content:"";position:absolute;inset:auto 0 0;height:30px;background:linear-gradient(120deg,#9e5834 20%,#d0a275 50%,#4d3325 80%);clip-path:polygon(0 100%,0 60%,20% 90%,46% 0,67% 85%,85% 30%,100% 95%,100% 100%);opacity:.65;pointer-events:none}
.member-hero p{color:#ead7c3}
button,.action-link{background:#a55339;border-radius:10px;color:white}button:hover,.action-link:hover{background:#8b412d}
.action-link.secondary{background:#f2e0d0;color:#87412d}.member-hero .action-link{background:#e4bf8d;color:#352316}
input,select,textarea{background:#fffefa;color:var(--text);border:1px solid var(--line);border-radius:10px}
input:focus,select:focus,textarea:focus{outline:2px solid #c78d5f;outline-offset:1px}
.tile-icon,.overview .value{color:#a55339}.tile-icon{background:#f5e6d6}.alert{background:#f5e6d6}
body.diwan-services{
 --surface:#fff;--canvas:#f3f7f4;--text:#18372a;--muted:#50695b;--line:#dce9e1;
}
.diwan-services>header{background:#fff;color:#163b2a;border-bottom:1px solid var(--line)}
.diwan-services>header:before{display:none}
.diwan-services>header nav a,.diwan-services>header nav .brand{color:#174c34}
.diwan-services .brand-mark{border-color:var(--line);background:#fff}
.diwan-services .diwan-public-utility{
 display:flex;align-items:center;justify-content:space-between;gap:10px;
 padding:8px max(20px,calc((100vw - 1210px)/2));background:#06432e;color:#fff;font-size:.77rem;
}
.diwan-services .diwan-public-utility a{color:inherit;text-underline-offset:3px}

.diwan-services .service-dashboard{display:grid;gap:20px}
.diwan-services .service-dashboard .member-hero{background:linear-gradient(120deg,#06432e,#086c47);border-color:#08704b;min-height:0}
.diwan-services .service-dashboard .member-hero:after{display:none}
.diwan-services .service-dashboard .member-hero p{color:#e0f3e8}
.diwan-services .service-dashboard .member-hero .action-link{background:#fff;color:#075138}
.diwan-services .service-dashboard .tile-icon{background:#e5f3ea;color:#086846}
.diwan-services .service-dashboard .tile:hover{border-color:#78ae92}
.diwan-services .service-dashboard .overview{margin:0}
.service-filters{display:grid;gap:12px;padding:16px;background:#fff;border:1px solid var(--line);border-radius:14px}
.service-filters .search-field{width:100%;max-width:none}
.service-categories{display:flex;flex-wrap:wrap;gap:8px}
.service-categories button{background:#edf5ef;color:#075138;border:1px solid var(--line)}
.service-categories button[aria-pressed=true],.service-categories button:hover,.service-reset{background:#086846;color:#fff}
.service-filter-status,.service-no-results{margin:0;color:var(--muted);font-size:.87rem}
.service-no-results{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:18px}
.diwan-services .service-dashboard :is(a,button,input):focus-visible{outline:3px solid #08754e;outline-offset:3px}
`;

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
const e = escapeHtml;
function wireServiceFilters() {
  const search = document.getElementById('section-search');
  if (!search) return;

  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
  const buttons = [...document.querySelectorAll('[data-service-category]')];
  const sections = [...document.querySelectorAll('[data-module-group]')].map(section => ({
    section,
    cards: [...section.querySelectorAll('.tile')].map(card => ({
      card, text: normalize(card.dataset.serviceSearch),
    })),
  }));
  const status = document.getElementById('service-filter-status');
  const empty = document.getElementById('search-empty');
  const number = new Intl.NumberFormat('ar-SA');
  let category = 'all';

  function update() {
    const query = normalize(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const { section, cards } of sections) {
      const inCategory = category === 'all' || section.dataset.moduleGroup === category;
      let matches = 0;
      for (const { card, text } of cards) {
        card.hidden = !inCategory || !query.every(word => text.includes(word));
        if (!card.hidden) matches++;
      }
      section.hidden = matches === 0;
      section.querySelector('[data-group-count]').textContent = number.format(matches);
      visible += matches;
    }
    status.textContent = 'الخدمات المعروضة: ' + number.format(visible);
    empty.hidden = visible !== 0;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.serviceCategory === category)));
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.serviceCategory;
    update();
  }));
  search.addEventListener('input', update);
  document.getElementById('reset-service-filters').addEventListener('click', () => {
    category = 'all';
    search.value = '';
    update();
    search.focus();
  });
  document.querySelector('.service-filters').hidden = false;
  update();
}

export const portalScript = "document.addEventListener('DOMContentLoaded'," + wireServiceFilters.toString() + ");\n" +
 "document.addEventListener('DOMContentLoaded',()=>{\n const fakhth=document.querySelector('select[name=\"fakhth\"]');\n const family=document.querySelector('select[name=\"family\"]');\n const parent=document.querySelector('select[name=\"parent\"]');\n const role=document.querySelector('select[name=\"role\"]');\n if(fakhth&&family){\n  const syncParent=()=>{\n   if(!parent)return;\n   Array.from(parent.options).forEach(opt=>{\n    if(!opt.value)return;\n    const okay=!family.value||opt.dataset.family===family.value;\n    opt.hidden=!okay;opt.disabled=!okay;\n   });\n   if(parent.selectedOptions[0]?.disabled)parent.value='';\n  };\n  const sync=()=>{\n   Array.from(family.options).forEach(opt=>{\n    if(!opt.value)return;\n    const okay=!fakhth.value||opt.dataset.fakhth===fakhth.value;\n    opt.hidden=!okay;opt.disabled=!okay;\n   });\n   if(family.selectedOptions[0]?.disabled)family.value='';\n   syncParent();\n  };\n  fakhth.addEventListener('change',sync);\n  family.addEventListener('change',syncParent);\n  if(role){\n   const roleSync=()=>{\n    const fam=role.value!=='diwan_fakhth_supervisor';\n    const par=role.value==='diwan_parent_supervisor';\n    family.required=fam;\n    if(parent)parent.required=par;\n    if(parent?.closest('label'))parent.closest('label').hidden=!par;\n    if(family.closest('label'))family.closest('label').hidden=!fam;\n   };\n   role.addEventListener('change',roleSync);roleSync();\n  }\n  sync();\n }\n const relationship=document.querySelector('select[name=\"relationship\"]');\n const gender=document.querySelector('select[name=\"gender\"]');\n if(relationship&&gender){\n  relationship.addEventListener('change',()=>{\n   if(['son','grandson'].includes(relationship.value))gender.value='male';\n   if(['daughter','granddaughter'].includes(relationship.value))gender.value='female';\n  });\n }\n});";
export function page(title, content, signedIn = false, { serviceLayout = false } = {}) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${e(title)} | ديوان الحازمي</title><style>${css}</style>${serviceLayout ? '' : '<link rel="stylesheet" href="https://youef.github.io/alhazmi/brand/portal-heritage.css?v=5">'}</head>
<body${serviceLayout ? ' class="diwan-services"' : ''}><header><div class="diwan-public-utility"><span>مبادرة أهلية مستقلة</span><a href="https://youef.github.io/alhazmi/ar/">الموقع العام</a></div><nav aria-label="التنقل"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true"><img src="https://youef.github.io/alhazmi/brand/diwan-emblem.webp" alt="" width="48" height="48"></span><span>ديوان الحازمي</span></a><a href="/">الرئيسية</a><a href="${publicSite}">الموقع العام</a>
${signedIn ? '<a href="/dashboard">لوحة التحكم</a><a href="/profile">الملف الشخصي</a><form method="post" action="/logout"><button type="submit">تسجيل الخروج</button></form>' : '<a href="/login">تسجيل الدخول</a>'}</nav></header>
<main>${content}</main><script>${portalScript}</script></body></html>`;
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
  ['membership', 'الأعضاء والأسرة', ['profile','tree','family','familyTimeline','familySpaces','requests','serviceRequests','services','documents','notifications','activity','membership','privacy','claims','delegations']],
  ['review', 'الإشراف ومراجعة الأنساب', ['workItems','genealogyReviews','suggestions','workflows']],
  ['system', 'إدارة النظام والصلاحيات', ['forms','permissions','roles','audit','backups']],
];

const glyphs = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  home:'<path d="m3 10 9-7 9 7v10H3z M9 20v-7h6v7"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  tree:'<path d="M12 3v6 M6 9h12 M6 9v5 M18 9v5 M3 14h6v6H3z M15 14h6v6h-6z M9 3h6v6H9z"/>',
  family:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21v-3a6 6 0 0 1 12 0v3 M14 15a5 5 0 0 1 8 4v2"/>',
  requests:'<path d="M6 3h9l4 4v14H6z M15 3v5h5 M9 12h7 M9 16h5"/>',
  notifications:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9 M10 21h4"/>',
  membership:'<rect x="2" y="5" width="20" height="14" rx="3"/><circle cx="8" cy="12" r="2"/><path d="M13 10h6 M13 14h6"/>',
  documents:'<path d="M7 2h7l5 5v15H7z M14 2v6h6 M10 13h6 M10 17h6"/>',
  roles:'<path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z M9 12l2 2 4-4"/>',
  audit:'<circle cx="11" cy="11" r="8"/><path d="m17 17 5 5 M8 11l2 2 4-4"/>',
  backups:'<path d="M4 4v6h6 M4 10a8 8 0 1 1 2 8 M12 7v5l4 2"/>',
  permissions:'<path d="M8 12h12 M8 16h9 M8 8h12 M4 8h.1 M4 12h.1 M4 16h.1"/>',

  members: '<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v2"/>',
  review: '<path d="M5 4h14v16H5z M8 12l3 3 5-6"/>',
  system: '<path d="M12 3l8 4v6c0 4-4 7-8 9-4-2-8-5-8-9V7z M9 12l2 2 4-4"/>',
};
const badge = status => `<span class="status">${e(status)}</span>`;
const icon = key => `<span class="tile-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none">${glyphs[key] || glyphs.system}</svg></span>`;

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

export function dashboard(user, modules, status, isAdmin = false) {
  const allowed = new Set(modules);
  const number = new Intl.NumberFormat('ar-SA');
  const available = groups.map(([id, label, keys]) => [id, label, keys.filter(key => allowed.has(key))])
    .filter(([, , keys]) => keys.length);
  const total = available.reduce((count, [, , keys]) => count + keys.length, 0);
  const keywords = {
    profile: 'الحساب البيانات الشخصية', tree: 'النسب الأقارب', family: 'الأب الأم الأبناء',
    services: 'المعاملات', requests: 'متابعة حالة الطلب', notifications: 'التنبيهات الرسائل',
    documents: 'الوثائق الملفات المرفقات', claims: 'ربط الحساب سجل الفرد',
  };
  const panels = available.map(([id, label, keys]) =>
    `<section data-module-group="${id}" aria-labelledby="services-${id}">
      <div class="section-heading"><h2 id="services-${id}">${label}</h2><small data-group-count>${number.format(keys.length)}</small></div>
      <div class="grid">${keys.map(key =>
        `<a class="tile card" href="/dashboard/${key}" data-service-search="${e([moduleNames[key], keywords[key], label].filter(Boolean).join(' '))}">
          ${icon(glyphs[key] ? key : id)}<strong>${moduleNames[key]}</strong>
        </a>`).join('')}</div>
    </section>`).join('');
  const filters = total ? `<section class="service-filters" aria-label="تصفية الخدمات" hidden>
    <label class="search-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${glyphs.search}</svg>
      <input id="section-search" type="search" aria-label="ابحث في الخدمات" placeholder="ابحث باسم خدمة أو موضوع" autocomplete="off">
    </label>
    <div class="service-categories" role="group" aria-label="فئات الخدمات">
      <button type="button" data-service-category="all" aria-pressed="true">كل الخدمات</button>
      ${available.map(([id, label]) => `<button type="button" data-service-category="${id}" aria-pressed="false">${label}</button>`).join('')}
    </div>
    <p class="service-filter-status" id="service-filter-status" role="status"></p>
  </section>
  <div id="search-empty" class="card service-no-results" hidden>
    <p>لا توجد خدمات مطابقة.</p><button class="service-reset" id="reset-service-filters" type="button">مسح التصفية</button>
  </div>` : '';
  return page('لوحة التحكم', `<div class="service-dashboard">
    <section class="member-hero">
      <div><h1>خدماتي</h1><p>مرحبًا، ${e(user.name)}</p></div>
      <div class="actions"><a class="action-link" href="/profile">الملف الشخصي</a>
        <a class="action-link" href="/family/manage">إدارة أسرتي</a>
        ${isAdmin ? '<a class="action-link" href="/admin">لوحة الإدارة</a><a class="action-link" href="/admin/genealogy">سجل الأفراد والأنساب</a>' : ''}
      </div>
    </section>
    <section class="overview" aria-label="نظرة عامة على الحساب">
      <div class="card"><h2>حالة العضوية</h2><p class="value">${e(status)}</p></div>
      <div class="card"><h2>الخدمات المتاحة</h2><p class="value">${number.format(total)}</p></div>
      ${isAdmin ? '<div class="card"><h2>مستوى الوصول</h2><p class="value">مدير عام</p></div>' : ''}
    </section>
    ${filters}
    ${panels || '<section class="card"><h2>ربط العضوية</h2><p>تُتاح خدمات العضوية بعد ربط الحساب بسجل معتمد وتفعيله من الإدارة. ملفك الشخصي متاح الآن.</p></section>'}
  </div>`, true, {serviceLayout:true});
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
