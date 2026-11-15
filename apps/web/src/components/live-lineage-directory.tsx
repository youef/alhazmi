'use client';

import { useEffect, useMemo, useState } from 'react';
import { GitBranch, Search, ShieldCheck, RefreshCw, ChevronDown, ListFilter } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { buildLineageTree, type LineageNode } from '@/lib/lineage-tree';
import { loadApprovedLineage } from '@/lib/lineage-loader';
import { getPublicLineage, type PublicUnit } from '@/lib/diwan-api';

const types: Record<string, [string, string]> = {
  branch: ['فرع', 'Branch'],
  clan: ['بطن', 'Clan'],
  subclan: ['فخذ', 'Subclan'],
  family: ['عائلة', 'Family'],
  house: ['بيت', 'House'],
};

function unitName(unit: PublicUnit, ar: boolean) {
  return ar ? unit.name_ar : unit.name_en || unit.name_ar;
}

function unitType(unit: PublicUnit, ar: boolean) {
  return types[unit.unit_type]?.[ar ? 0 : 1] ?? unit.unit_type;
}

function TreeNode({ node, ar, expanded, onToggle }: {
  node: LineageNode;
  ar: boolean;
  expanded: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  const label = <>
    <GitBranch size={17} aria-hidden="true" />
    <strong>{unitName(node.unit, ar)}</strong>
    <span className="unit-tag">{unitType(node.unit, ar)}</span>
  </>;
  if (!node.children.length) return <li><div className="tree-leaf">{label}</div></li>;

  const open = expanded.has(node.unit.id);
  return <li>
    <button type="button" className="tree-toggle" aria-expanded={open} onClick={() => onToggle(node.unit.id)}>
      {label}
      <span className="tree-child-count">{node.children.length} {ar ? 'تابع' : 'children'}</span>
      <ChevronDown size={17} className="tree-chevron" aria-hidden="true" />
    </button>
    {open && <ul id={`tree-children-${node.unit.id}`}>
      {node.children.map(child =>
        <TreeNode key={child.unit.id} node={child} ar={ar} expanded={expanded} onToggle={onToggle} />)}
    </ul>}
  </li>;
}

export function LiveLineageDirectory({ locale, view }: { locale: Locale; view: 'branches' | 'lineage' }) {
  const ar = locale === 'ar';
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  return <section className="directory-shell" aria-label={ar ? 'دليل الأنساب المعتمدة' : 'Approved genealogy directory'}>
    <div className="directory-policy"><ShieldCheck size={18} aria-hidden="true"/>
      <span>{ar ? 'يعرض الدليل وحدات النسب المعتمدة للنشر.' : 'The directory shows lineage units approved for publication.'}</span>
    </div>
    <div className="directory-toolbar">
      <div className="directory-search"><Search size={18} aria-hidden="true"/>
        <input aria-label={ar ? 'البحث بالأفخاذ والعوائل' : 'Search branches and families'} value={search}
          onChange={event => setSearch(event.target.value)} maxLength={100}
          placeholder={ar ? 'ابحث عن فخذ أو عائلة معتمدة…' : 'Search approved branches and families…'} />
      </div>
    </div>
    {search.trim() !== query ? <p role="status">{ar ? 'جارٍ البحث…' : 'Searching…'}</p>
      : <DirectoryResults key={query} query={query} ar={ar} view={view} />}
  </section>;
}

function DirectoryResults({ query, ar, view }: { query: string; ar: boolean; view: 'branches' | 'lineage' }) {
  const [items, setItems] = useState<PublicUnit[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [pageError, setPageError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const controller = new AbortController();
    const fetchPage = (offset: number) => getPublicLineage(offset, controller.signal, query);
    const load = view === 'lineage' && !query
      ? loadApprovedLineage(fetchPage, (units, offset) => {
          if (!controller.signal.aborted) { setItems(units); setNextOffset(offset); }
        })
      : fetchPage(0).then(page => ({ items: page.data, nextOffset: page.meta.nextOffset }));
    load.then(result => {
      if (!controller.signal.aborted) {
        setItems(result.items);
        setNextOffset(result.nextOffset);
      }
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [nonce, query, view]);

  function refresh() {
    setLoading(true);
    setError(false);
    setPageError(false);
    setItems([]);
    setExpanded(new Set());
    setNextOffset(null);
    setNonce(value => value + 1);
  }

  async function more() {
    if (nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    setPageError(false);
    try {
      const page = await getPublicLineage(nextOffset, undefined, query);
      setItems(old => [...new Map([...old, ...page.data].map(item => [item.id, item])).values()]);
      setNextOffset(page.meta.nextOffset);
    } catch { setPageError(true); }
    finally { setLoadingMore(false); }
  }

  const showTree = view === 'lineage' && !query;
  const tree = useMemo(() => showTree ? buildLineageTree(items) : [], [items, showTree]);
  const visibleItems = filter === 'all' ? items : items.filter(item => item.unit_type === filter);
  const names = new Map(items.map(item => [item.id, unitName(item, ar)]));
  const toggleNode = (id: string) => setExpanded(previous => {
    const updated = new Set(previous);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    return updated;
  });
  const expandAll = () => setExpanded(new Set(items.map(item => item.id)));
  const collapseAll = () => setExpanded(new Set());

  return <>
    <div className="directory-controls">
      {view === 'branches' && <label className="directory-filter">
        <ListFilter size={17} aria-hidden="true" />
        <span>{ar ? 'نوع الوحدة' : 'Unit type'}</span>
        <select value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="all">{ar ? 'الكل' : 'All types'}</option>
          {Object.entries(types).map(([type, labels]) => <option key={type} value={type}>{labels[ar ? 0 : 1]}</option>)}
        </select>
      </label>}
      {showTree && !loading && !error && items.length > 0 && <>
        <button className="directory-retry" type="button" onClick={expandAll}>
          {ar ? 'توسيع الكل' : 'Expand all'}
        </button>
        <button className="directory-retry" type="button" onClick={collapseAll}>
          {ar ? 'طي الكل' : 'Collapse all'}
        </button>
      </>}
      <button className="directory-retry" type="button" onClick={refresh} disabled={loading || loadingMore}>
        <RefreshCw size={17} aria-hidden="true"/>{ar ? 'تحديث' : 'Refresh'}
      </button>
    </div>
    {loading ? <p role="status" className="directory-state">{ar
        ? `جارٍ تحميل شجرة الأنساب المعتمدة… تم جلب ${items.length} وحدة.`
        : `Loading approved lineage… ${items.length} units received.`}</p>
      : error ? <p role="alert" className="directory-state">{ar ? 'تعذر الوصول إلى خدمة البيانات. جرّب التحديث.' : 'The directory is unavailable. Try refreshing.'}</p>
      : items.length === 0 ? <p role="status" className="directory-state">{query ? (ar ? 'لا توجد نتائج مطابقة.' : 'No matching records.') : ar ? 'لا توجد وحدات نسب معتمدة للنشر حتى الآن؛ السجلات المستوردة تنتظر المراجعة.' : 'No lineage units have been approved for public publication yet.'}</p>
      : showTree ? <>
        <p role="status" className="directory-caption">{ar
          ? `${items.length} وحدة نسب معتمدة • ${tree.length} جذور في السجلات المحمّلة${nextOffset !== null ? ' • توجد صفحات أخرى' : ''}`
          : `${items.length} approved units • ${tree.length} roots in loaded records${nextOffset !== null ? ' • More pages available' : ''}`}</p>
        <ul className="unit-tree">{tree.map(node =>
          <TreeNode key={node.unit.id} node={node} ar={ar} expanded={expanded} onToggle={toggleNode} />)}</ul>
      </>
      : visibleItems.length === 0 ? <p role="status" className="directory-state">{ar ? 'لا توجد وحدات من هذا النوع ضمن النتائج المحمَّلة.' : 'None of the loaded results match this type.'}</p>
      : <div className="directory-list">
        {filter !== 'all' && <p className="directory-caption">{ar ? 'يُطبق الفلتر على السجلات المحمّلة.' : 'The filter applies to loaded records.'}</p>}
        {visibleItems.map(item => <article className="directory-item" key={item.id}>
          <div className="directory-icon"><GitBranch size={20} aria-hidden="true" /></div>
          <div><h2>{unitName(item, ar)}</h2><p>{unitType(item, ar)} · {ar ? 'معتمد' : 'Approved'}</p></div>
          {item.parent_id && names.has(item.parent_id) &&
            <span className="directory-parent">{ar ? 'يتبع' : 'Parent'}: {names.get(item.parent_id)}</span>}
        </article>)}
      </div>}
    {pageError && <p role="alert" className="directory-state">{ar ? 'تعذر تحميل المزيد. حاول مجددًا.' : 'Could not load more records. Try again.'}</p>}
    {nextOffset !== null && !loading && !error && <button type="button" disabled={loadingMore} className="directory-load-more" onClick={more}>{loadingMore ? (ar ? 'جارٍ التحميل...' : 'Loading...') : (ar ? 'تحميل المزيد' : 'Load more')}</button>}
  </>;
}
