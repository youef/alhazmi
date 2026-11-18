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

.tree-workspace .tree-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;
 background:radial-gradient(ellipse at 18% 10%,#197452,#073f2d 78%);border:1px solid #116647}
.tree-metrics{display:flex;gap:8px;margin:0;flex-wrap:wrap}
.tree-metrics div{display:grid;grid-template-columns:1fr;gap:0;min-width:88px;padding:8px 12px;
 border:1px solid #ffffff40;border-radius:10px;background:#ffffff12}
.tree-metrics dt{color:#dcefe6;font-size:.78rem}.tree-metrics dd{font-size:1.35rem;font-weight:850}
.tree-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px}
.tree-toolbar h2{margin:0}
.tree-display{padding:4px;margin:0;gap:3px;border:1px solid #dce9e1;border-radius:10px;background:#f4f9f6}
.tree-display a{min-height:38px;padding:6px 13px;color:#355e4a;border-radius:7px}
.tree-display a[aria-current=page]{background:#086846;color:#fff}
.tree-filters{padding:12px;background:#f5faf7;border:1px solid #deebe3;border-radius:12px;margin-bottom:14px}
.tree-map,.tree-map-results{display:grid;gap:12px;scroll-margin-top:14px}
.tree-map-switch{display:flex;gap:8px;overflow-x:auto;padding:4px 4px 9px;scroll-snap-type:x proximity}
.tree-map-switch .tree-node{flex:0 0 auto;min-width:126px;scroll-snap-align:start}
.tree-map-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,280px);gap:12px;align-items:start}
.tree-diagram{padding:clamp(12px,3vw,22px);border:1px solid #dce9e1;border-radius:14px;min-width:0;
 background-color:#f7fbf8;background-image:radial-gradient(#a9c8b7 1px,transparent 1px);background-size:18px 18px}
.tree-diagram-heading{width:fit-content;padding:7px 10px;border-radius:8px;background:#f7fbf8}
.tree-diagram-heading h3{margin-bottom:0}.tree-diagram-heading p{color:#425e50;font-size:.83rem}
.tree-route{list-style:none;display:flex;flex-wrap:wrap;justify-content:center;gap:16px;
 margin:17px 0 0;padding:0}
.tree-route li{position:relative;display:flex;min-width:0}
.tree-route li+li:before{content:'';position:absolute;inset-inline-start:-16px;top:50%;width:16px;border-top:2px solid #66957e}
.tree-node{display:grid;align-content:center;gap:3px;min-height:60px;padding:8px 12px;max-width:100%;
 background:#fff;border:1px solid #b7d5c4;border-radius:10px;text-decoration:none;color:#153f2c;overflow-wrap:anywhere}
.tree-node small{color:#4d695b;font-size:.73rem}.tree-node strong{line-height:1.35}
a.tree-node:hover{background:#e7f4ed;border-color:#0b754e}
.tree-node[aria-current],.tree-current .tree-node{background:#07543a;border-color:#07543a;color:#fff}
.tree-node[aria-current] small,.tree-current .tree-node small{color:#deefe6}
.tree-descendants{position:relative;margin-top:20px;padding:13px;border:1px solid #bad5c5;border-radius:12px;background:#f3faf6}
.tree-descendants:before{content:'';position:absolute;top:-21px;left:50%;height:20px;border-left:2px solid #66957e}
.tree-descendants h3 span{margin-inline-start:5px;padding:0 6px;border-radius:5px;background:#dcefe4;color:#12523a}
.tree-child-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,137px),1fr));gap:7px}
.tree-empty{color:#4d695b;padding:7px 0}
.tree-pages{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px}
.tree-inspector{display:grid;gap:9px;padding:16px;background:#fff;border:1px solid #dce9e1;border-radius:14px}
.tree-inspector h2{margin:0}.tree-inspector>small,.tree-review{color:#2d6650;font-weight:750}
.tree-inspector dl{display:grid;grid-template-columns:1fr;gap:2px;margin:0}
.tree-inspector dt{color:#4d695b;font-size:.78rem}.tree-inspector dd{margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e2eee6}
.tree-inspector .tree-link{justify-content:center}
.tree-inspector details{font-size:.86rem}.tree-inspector summary{cursor:pointer;font-weight:750}
.tree-inspector ul{margin:4px 0;padding-inline-start:20px}
@media(max-width:720px){
 .tree-workspace .tree-hero{align-items:flex-start;flex-direction:column}
 .tree-map-grid{grid-template-columns:1fr}
 .tree-route{flex-direction:column;align-items:center}
 .tree-route li+li:before{inset-inline-start:50%;top:-16px;height:16px;width:0;border:0;border-inline-start:2px solid #66957e}
}
`;

const formatCount = new Intl.NumberFormat('ar-SA');
function matchingUnits(items, state) {
  const normalize = value => value.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g,'ي').toLocaleLowerCase('ar');
  const query = normalize(state.query);
  return items.filter(unit =>
    (!query || normalize(unit.name_ar).includes(query)) &&
    (!state.type || (state.type === 'subclan' ? unit.registered_fakhth || unit.unit_type === 'subclan' : unit.unit_type === state.type))
  );
}

function indexTree(items) {
  const byId = new Map(items.map(item => [item.id, item]));
  const children = new Map();
  const registeredFamilies = new Map();
  const roots = [];
  for (const item of items) {
    if (!byId.has(item.parent_id)) roots.push(item);
    else {
      if (!children.has(item.parent_id)) children.set(item.parent_id,[]);
      children.get(item.parent_id).push(item);
    }
    if (byId.has(item.fakhth_unit_id)) {
      if (!registeredFamilies.has(item.fakhth_unit_id)) registeredFamilies.set(item.fakhth_unit_id,[]);
      registeredFamilies.get(item.fakhth_unit_id).push(item);
    }
  }
  return { byId, children, registeredFamilies, roots };
}

function traceAncestors(item, byId) {
  const found = new Set([item.id]);
  const ancestorPath = [];
  for (let parent=byId.get(item.parent_id);parent&&!found.has(parent.id);parent=byId.get(parent.parent_id)) {
    ancestorPath.push(parent);
    found.add(parent.id);
  }
  return ancestorPath.reverse();
}

function lineageMap(data, state, graph, matching) {
  const filtering = Boolean(state.query || state.type);
  const visibleRoots = graph.roots.filter(root=>!(root.parent_id && root.unit_type==='family'));
  const branches = visibleRoots.length ? visibleRoots : graph.roots;
  const unit = data.focused || (filtering ? matching[0] : branches[0] || data.items[0]);
  const links = items => items.map(item =>
    `<a class="tree-node" href="${e(state.url({unit:item.id,children_page:''}))}#tree-map"
      ${item.id===unit?.id?'aria-current="location"':''}><small>${e(kind(item))}</small><strong>${e(item.name_ar)}</strong></a>`
  ).join('');
  if (!unit) return '<p class="tree-empty">لا توجد وحدات تطابق البحث.</p>';
  const route = traceAncestors(unit,graph.byId);
  const parent = graph.byId.get(unit.parent_id);
  const direct = graph.children.get(unit.id)||[];
  const registered = graph.registeredFamilies.get(unit.id)||[];
  const distinctRegistered = registered.filter(item=>item.parent_id!==unit.id);
  const associated = [...direct,...distinctRegistered];
  const siblings = parent ? (graph.children.get(parent.id)||[]).filter(item=>item.id!==unit.id) : [];
  const pageSize = 12;
  const totalPages = Math.max(1,Math.ceil(associated.length/pageSize));
  const currentPage = Math.min(totalPages,state.childrenPage);
  const pageLink = (next,label) => `<a class="tree-link" href="${e(state.url({unit:unit.id,children_page:next}))}#tree-children">${label}</a>`;
  const registeredFakhth = graph.byId.get(unit.fakhth_unit_id);
  const peopleScope = registeredFakhth ? {fakhth:registeredFakhth.id,family:unit.id} :
    unit.registered_fakhth ? {fakhth:unit.id} : null;
  const major = graph.byId.get(unit.major_branch_id);
  const control = item => `<a href="${e(state.url({unit:item.id,children_page:''}))}#tree-map">${e(item.name_ar)}</a>`;
  return `<section class="tree-map" id="tree-map" aria-label="خريطة علاقات النسب">
    ${filtering ? `<div class="tree-map-results"><h3>${formatCount.format(matching.length)} نتيجة</h3>
      ${matching.length ? '<div class="tree-map-switch">'+links(matching.slice(0,18))+'</div>' : '<p>لا توجد وحدات تطابق البحث.</p>'}
      ${matching.length>18?`<a class="tree-link" href="${e(state.url({view:'list'}))}#tree-list">جميع النتائج</a>`:''}</div>`
     : `<div class="tree-map-switch" aria-label="الفروع">${links(branches)}</div>`}
    <div class="tree-map-grid">
      <div class="tree-diagram">
        <div class="tree-diagram-heading"><h3>مسار النسب</h3>
          <p>اختر أي بطاقة للانتقال إلى علاقاتها.</p></div>
        <ol class="tree-route">
          ${route.map(item=>`<li>${links([item])}</li>`).join('')}
          <li class="tree-current"><span class="tree-node"><small>${e(kind(unit))}</small><strong>${e(unit.name_ar)}</strong></span></li>
        </ol>
        <div class="tree-descendants" id="tree-children">
          <h3>الوحدات التابعة والمرتبطة <span>${formatCount.format(associated.length)}</span></h3>
          ${associated.length ? `<div class="tree-child-grid">${links(associated.slice((currentPage-1)*pageSize,currentPage*pageSize))}</div>`
            : '<p class="tree-empty">لا توجد وحدات تابعة ظاهرة لهذه الوحدة.</p>'}
          ${totalPages>1?`<div class="tree-pages">${currentPage>1?pageLink(currentPage-1,'السابق'):''}
            <span>${formatCount.format(currentPage)} / ${formatCount.format(totalPages)}</span>
            ${currentPage<totalPages?pageLink(currentPage+1,'التالي'):''}</div>`:''}
        </div>
      </div>
      <aside class="tree-inspector" aria-label="علاقات الوحدة">
        <small>${e(kind(unit))}</small><h2>${e(unit.name_ar)}</h2>
        ${data.canManage ? `<p class="tree-review">${e(reviews[unit.review_status]||'بلا مراجعة')}</p>` : ''}
        <dl><dt>الأصل المباشر</dt><dd>${parent?control(parent):'—'}</dd>
          ${registeredFakhth?`<dt>الفخذ المرتبط</dt><dd>${control(registeredFakhth)}</dd>`:''}
          ${major?`<dt>الفرع الرئيسي</dt><dd>${control(major)}</dd>`:''}
          ${registered.length?`<dt>العائلات المرتبطة</dt><dd>${formatCount.format(registered.length)}</dd>`:''}
          <dt>التوابع المباشرة</dt><dd>${formatCount.format(direct.length)}</dd>
          <dt>تحت الأصل نفسه</dt><dd>${formatCount.format(siblings.length)}</dd>
        </dl>
        ${siblings.length?`<details><summary>عرض الوحدات تحت الأصل نفسه</summary><ul>
          ${siblings.slice(0,12).map(item=>`<li>${control(item)}</li>`).join('')}</ul>
          ${siblings.length>12?`<a href="${e(state.url({unit:parent.id,children_page:''}))}#tree-children">عرض بقية الوحدات</a>`:''}</details>`:''}
        ${data.canBrowsePeople&&peopleScope?`<a class="tree-link" href="/admin/members?${e(new URLSearchParams(peopleScope))}">عرض الأفراد والعضويات</a>`:''}
        ${data.canManage?`<a class="tree-link" href="${e(state.url({unit:unit.id}))}#tree-unit">تعديل الوحدة وروابطها</a>`:''}
      </aside>
    </div>
  </section>`;
}

function lineageList(items, state, canManage) {
  const byId = new Map(items.map(item => [item.id, item]));
  const children = new Map();
  const roots = [];
  const matching = new Set(matchingUnits(items,state).map(item=>item.id));
  const filtering = Boolean(state.query || state.type);
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
    const link = `<a class="tree-action" href="${e(state.url({ view:'map',unit:unit.id }))}#tree-map">عرض على الخريطة</a>`;
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
    const withdraw = unit.review_status === 'approved'
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
  const view = params.get('view') === 'list' ? 'list' : 'map';
  const requestedPage = Number(params.get('children_page'));
  const childrenPage = Number.isSafeInteger(requestedPage)&&requestedPage>0?requestedPage:1;
  const state = {
    query, type, childrenPage,
    url(overrides = {}) {
      const clean = new URLSearchParams();
      for (const [key, value] of Object.entries({ tribe, q:query, type, view,
        unit:data.focused?.id, children_page:childrenPage>1?childrenPage:'', ...overrides })) {
        if (value) clean.set(key,value);
      }
      return clean.size ? path + '?' + clean : path;
    },
  };
  const graph = indexTree(data.items);
  const matching = matchingUnits(data.items,state);
  const tree = view === 'list' ? lineageList(data.items,state,data.canManage) : lineageMap(data,state,graph,matching);
  const metrics = [
    ['الفروع',data.items.filter(item=>item.unit_type==='branch').length],
    ['الأفخاذ',data.items.filter(item=>item.registered_fakhth||item.unit_type==='subclan').length],
    ['العائلات',data.items.filter(item=>item.unit_type==='family').length],
  ];
  return page('شجرة النسب', `<style>${styles}</style><div class="tree-workspace">
    <header class="tree-hero"><div><a href="/dashboard">خدماتي</a><h1>شجرة النسب</h1>
      <p>${data.canManage ? 'استكشف الفروع والأفخاذ والعائلات وأدر روابطها.' : 'استكشف الفروع والأفخاذ والعائلات المعتمدة.'}</p></div>
      <dl class="tree-metrics">${metrics.map(([label,value])=>`<div><dt>${label}</dt><dd>${formatCount.format(value)}</dd></div>`).join('')}</dl>
    </header>
    ${error ? `<div class="tree-notice error" role="alert">${e(error)}</div>`
      : params.get('done') === '1' ? '<div class="tree-notice" role="status">تم تنفيذ الإجراء.</div>' : ''}
    <section class="tree-card" id="tree-list">
      <div class="tree-toolbar"><h2>استكشاف النسب</h2>
        <nav class="tree-display" aria-label="طريقة العرض">
          <a href="${e(state.url({view:'map'}))}#tree-list"${view==='map'?' aria-current="page"':''}>الخريطة</a>
          <a href="${e(state.url({view:'list'}))}#tree-list"${view==='list'?' aria-current="page"':''}>القائمة</a>
        </nav>
      </div>
      <form class="tree-filters" method="get" action="${path}#tree-list">
        ${hidden('view',view)}
        ${data.tribes?.length > 1 ? `<label>القبيلة<select name="tribe">${data.tribes.map(item => option(item,tribe)).join('')}</select></label>` : hidden('tribe',tribe)}
        <label>اسم الوحدة<input name="q" type="search" maxlength="100" value="${e(query)}"></label>
        <label>النوع<select name="type"><option value="">الكل</option>${Object.entries(kinds).map(([id,name_ar]) => option({id,name_ar},type)).join('')}</select></label>
        <button type="submit">بحث</button>
        ${query || type ? `<a class="tree-link" href="${e(state.url({ q:'',type:'',unit:'',children_page:'' }))}#tree-list">مسح البحث</a>` : ''}
        ${data.canManage ? '<a class="tree-link" href="#tree-add">إضافة فخذ أو عائلة</a>' : ''}
      </form>
      ${tree}
    </section>
    ${data.canManage ? management(data,state,csrf) : ''}
  </div>`,true,{serviceLayout:true});
}

