import { escapeHtml as e, page } from './member-views.js';

const path = '/dashboard/tree';
const kinds = { branch: 'فرع', clan: 'قسم', subclan: 'فخذ', family: 'عائلة', house: 'بيت' };
const reviews = { needs_review: 'قيد المراجعة', verified: 'موثّق', approved: 'معتمد', disputed: 'متنازع عليه', rejected: 'مرفوض' };
const kind = unit => unit.registered_fakhth ? 'فخذ' : kinds[unit.unit_type] || 'وحدة نسب';
const hidden = (name, value) => `<input type="hidden" name="${e(name)}" value="${e(value)}">`;
const option = (item, selected) => `<option value="${e(item.id)}"${item.id === selected ? ' selected' : ''}>${e(item.name_ar || item.title)}</option>`;

const styles = `
.tree-workspace{display:grid;gap:18px;color:#18372a}
.tree-workspace .tree-hero{padding:clamp(18px,4vw,34px);border-radius:18px;background:linear-gradient(120deg,#06432e,#08704b);color:#fff}
.tree-hero h1{margin:5px 0;color:inherit}.tree-hero p{margin:0;color:#e1f3e8}
.tree-hero a{color:#fff}
.tree-workspace .tree-card{margin:0;padding:clamp(14px,3vw,22px);background:#fff;border:1px solid #dce9e1;border-radius:16px}
.tree-workspace h2,.tree-workspace h3{margin-block:0 8px}
.tree-filters,.tree-form{display:flex;flex-wrap:wrap;align-items:end;gap:10px}
.tree-workspace label{display:grid;flex:1 1 190px;gap:4px;font-size:.9rem;font-weight:700;min-width:0}
.tree-workspace :is(select,input){max-width:100%;min-height:44px;font:inherit}
.tree-workspace input[type=checkbox]{min-height:auto;margin-inline-end:4px}
.tree-workspace button,.tree-workspace .tree-link{display:inline-flex;align-items:center;min-height:44px;padding:8px 13px;border-radius:9px;font-weight:750}
.tree-workspace button{background:#086846;color:#fff}
.tree-workspace .tree-link{background:#edf6f0;color:#075138;text-decoration:none}
.tree-workspace .tree-danger button{background:#a03931}
.tree-entry{padding:9px 0;border-block-end:1px solid #e4eee7}
.tree-entry:last-child{border-block-end:0}.tree-entry>summary{cursor:pointer;color:#18372a}
.tree-entry a{color:#075138}
.tree-items{margin:0;padding-inline-start:clamp(12px,3vw,23px);list-style:none}
.tree-items .tree-items{border-inline-start:1px solid #bdd8c8;margin-inline-start:6px}
.tree-metadata{display:inline-block;margin-inline:7px;color:#4b6558;font-size:.79rem}
.tree-action{display:inline-flex;padding:4px 9px;font-size:.83rem}
.tree-tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px}
.tree-tools>section{padding:14px;background:#f6faf7;border:1px solid #dce9e1;border-radius:12px;min-width:0}
.tree-manage{display:grid;gap:12px;scroll-margin-top:12px}
.tree-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:start}
.tree-notice{padding:11px 15px;border-radius:9px;background:#e5f4eb;color:#14543b}
.tree-notice.error{background:#fff0ee;color:#8f3028}
.tree-workspace :is(a,button,input,select,summary):focus-visible{outline:3px solid #08754e;outline-offset:3px}
`;

function lineageList(items, state, canManage) {
  const byId = new Map(items.map(item => [item.id, item]));
  const children = new Map();
  const roots = [];
  const normalize = value => value.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا');
  const query = normalize(state.query);
  const matching = new Set(items.filter(unit =>
    (!query || normalize(unit.name_ar).includes(query)) &&
    (!state.type || (state.type === 'subclan' ? unit.registered_fakhth || unit.unit_type === 'subclan' : unit.unit_type === state.type))
  ).map(unit => unit.id));
  const filtering = Boolean(query || state.type);
  const visible = new Set(matching);

  if (filtering) {
    for (const id of matching) {
      let parent = byId.get(id)?.parent_id;
      while (byId.has(parent) && !visible.has(parent)) {
        visible.add(parent);
        parent = byId.get(parent).parent_id;
      }
    }
  }
  for (const unit of items) {
    if (!visible.has(unit.id)) continue;
    if (!visible.has(unit.parent_id)) roots.push(unit);
    else {
      if (!children.has(unit.parent_id)) children.set(unit.parent_id, []);
      children.get(unit.parent_id).push(unit);
    }
  }
  const rendered = new Set();
  function render(unit, depth) {
    if (rendered.has(unit.id)) return '';
    rendered.add(unit.id);
    const nested = children.get(unit.id) || [];
    const meta = [kind(unit), canManage && (reviews[unit.review_status] || 'بلا مراجعة')].filter(Boolean).join(' · ');
    const label = `<strong>${e(unit.name_ar)}</strong><span class="tree-metadata">${e(meta)}</span>`;
    const link = canManage ? `<a class="tree-action" href="${e(state.url({ unit: unit.id }))}#tree-unit">إدارة ${e(unit.name_ar)}</a>` : '';
    if (!nested.length || depth >= 40) return `<li class="tree-entry">${label}${link}</li>`;
    return `<li class="tree-entry"><details${filtering || depth === 0 ? ' open' : ''}>
      <summary>${label}<span class="tree-metadata">${nested.length} تابعة</span></summary>${link}
      <ul class="tree-items">${nested.map(item => render(item, depth + 1)).join('')}</ul>
    </details></li>`;
  }
  if (!visible.size) return '<p>لا توجد وحدات تطابق البحث.</p>';
  const content = roots.map(item => render(item, 0)).join('');
  const disconnected = items.filter(item => visible.has(item.id) && !rendered.has(item.id))
    .map(item => render(item, 0)).join('');
  return `<ul class="tree-items">${content}${disconnected}</ul>`;
}

function management(data, state, csrf) {
  if (!data.tribe) return '<p>أضف قبيلة قبل تسجيل الأفخاذ والعائلات.</p>';
  const roots = data.items.filter(unit => unit.unit_type === 'branch' && !unit.parent_id);
  const fakhths = data.items.filter(unit => unit.registered_fakhth);
  const byId = new Map(data.items.map(unit => [unit.id, unit]));
  const form = (operation, fields, label, anchor = 'tree-unit') =>
    `<form class="tree-form" method="post" action="${e(state.url())}#${anchor}">
      ${hidden('csrf',csrf)}${hidden('operation',operation)}${fields}
      <button type="submit">${e(label)}</button>
    </form>`;
  const chooser = (title, name, options, selected, required = true) =>
    `<label>${title}<select name="${name}"${required ? ' required' : ''}><option value="">اختر</option>
      ${options.map(item => option(item, selected)).join('')}</select></label>`;
  const name = value => `<label>الاسم<input name="name" minlength="3" maxlength="150" value="${e(value)}" required></label>`;
  const create = (type, parents, title, parentLabel) => `<section><h3>${title}</h3>
    ${!parents.length || !data.sources.length
      ? '<p>يتطلب التسجيل أصلًا متاحًا ومصدر توثيق مسجلًا لهذه القبيلة.</p>'
      : form('create_unit', hidden('tribe_id',data.tribe.id) + hidden('unit_type',type) + name('') +
          chooser(parentLabel,'parent_id',parents) + chooser('مصدر التوثيق','source_id',data.sources),title,'tree-add')}
  </section>`;

  const unit = data.focused;
  let editor = '';
  if (unit) {
    const isFakhth = unit.registered_fakhth || unit.unit_type === 'subclan';
    const isFamily = unit.unit_type === 'family';
    const parentOptions = isFamily ? fakhths : isFakhth ? roots : [];
    const currentParent = byId.get(unit.parent_id);
    const choices = currentParent && !parentOptions.some(item => item.id === currentParent.id)
      ? [currentParent, ...parentOptions] : parentOptions;
    const linked = byId.get(unit.fakhth_unit_id);
    const update = form('edit_unit', hidden('id',unit.id) + (isFamily && !linked ? hidden('ensure_fakhth','yes') : '') + name(unit.name_ar) +
      (isFamily || isFakhth ? chooser(isFamily ? 'الفخذ المرتبط' : 'الفرع الرئيسي','parent_id',choices,unit.parent_id)
        : hidden('parent_id',unit.parent_id || '')), 'حفظ التعديلات');
    const withdraw = unit.review_status && unit.review_status !== 'needs_review'
      ? `<details><summary>إيقاف النشر للمراجعة</summary>${form('withdraw_unit', hidden('id',unit.id) +
          '<label><span><input type="checkbox" name="confirm" value="yes" required> تأكيد إيقاف النشر</span></label>','إيقاف النشر')}</details>` : '';
    const remove = unit.can_delete ? `<details class="tree-danger"><summary>حذف المسودة</summary>${form('delete_unit_draft',
      hidden('id',unit.id) + '<label><span><input type="checkbox" name="confirm" value="delete" required> تأكيد حذف المسودة</span></label>','حذف المسودة')}</details>` : '';
    editor = `<section class="tree-card tree-manage" id="tree-unit"><h2>إدارة ${e(unit.name_ar)}</h2>
      <p>${e(kind(unit))} · ${e(reviews[unit.review_status] || 'بلا مراجعة')}${linked ? ' · الفخذ المسجل: ' + e(linked.name_ar) : ''}</p>
      ${update}<div class="tree-actions">${withdraw}${remove}</div>
    </section>`;
  }
  return editor + `<section class="tree-card tree-manage" id="tree-add"><h2>إضافة إلى الشجرة</h2>
    <p>تُحفظ الإضافات والتعديلات للمراجعة قبل ظهورها للأعضاء.</p><div class="tree-tools">
      ${create('subclan',roots,'إضافة فخذ','الفرع الرئيسي')}${create('family',fakhths,'إضافة عائلة','الفخذ المرتبط')}
    </div></section>`;
}

export function lineageTreeView(data, params, csrf, error = '') {
  const tribe = data.tribe?.id || '';
  const query = (params.get('q') || '').trim().slice(0, 100);
  const filter = params.get('type');
  const type = Object.hasOwn(kinds,filter) ? filter : '';
  const state = {
    query, type,
    url(overrides = {}) {
      const clean = new URLSearchParams();
      for (const [key, value] of Object.entries({ tribe, q: query, type, unit: data.focused?.id, ...overrides })) {
        if (value) clean.set(key,value);
      }
      return clean.size ? path + '?' + clean : path;
    },
  };
  const tree = lineageList(data.items,state,data.canManage);
  return page('شجرة النسب', `<style>${styles}</style><div class="tree-workspace">
    <header class="tree-hero"><a href="/dashboard">خدماتي</a><h1>شجرة النسب</h1>
      <p>${data.canManage ? 'إدارة الفروع والأفخاذ وروابط العائلات' : 'تصفّح الفروع والعائلات المعتمدة'}</p>
    </header>
    ${error ? `<div class="tree-notice error" role="alert">${e(error)}</div>`
      : params.get('done') === '1' ? '<div class="tree-notice" role="status">تم تنفيذ الإجراء.</div>' : ''}
    <section class="tree-card" id="tree-list">
      <h2>الفروع والأفخاذ والعائلات</h2>
      <form class="tree-filters" method="get" action="${path}#tree-list">
        ${data.tribes?.length > 1 ? `<label>القبيلة<select name="tribe">${data.tribes.map(item => option(item,tribe)).join('')}</select></label>` : hidden('tribe',tribe)}
        <label>اسم الوحدة<input name="q" type="search" maxlength="100" value="${e(query)}"></label>
        <label>النوع<select name="type"><option value="">الكل</option>${Object.entries(kinds).map(([id,name_ar]) => option({id,name_ar},type)).join('')}</select></label>
        <button type="submit">بحث</button>
        ${query || type ? `<a class="tree-link" href="${e(state.url({ q:'',type:'',unit:'' }))}#tree-list">مسح البحث</a>` : ''}
        ${data.canManage ? '<a class="tree-link" href="#tree-add">إضافة فخذ أو عائلة</a>' : ''}
      </form>
      ${tree}
    </section>
    ${data.canManage ? management(data,state,csrf) : ''}
  </div>`,true,{serviceLayout:true});
}

