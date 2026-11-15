'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, Check, ChevronDown, Compass, Copy, FolderTree,
  GitBranch, House, LayoutGrid, List, Network, RefreshCw, Search,
  ShieldCheck, Sparkles, X,
} from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import type { PublicUnit } from '@/lib/diwan-api';
import { getPublicLineage } from '@/lib/diwan-api';
import { loadApprovedLineage } from '@/lib/lineage-loader';
import { buildLineageTree, type LineageNode } from '@/lib/lineage-tree';
import {
  ancestryOf, countDescendants, findLineageNode, lineageTypeCounts,
  normalizeArabic, pruneLineageTree,
} from '@/lib/lineage-explorer-utils';

type Mode = 'tree' | 'list';
const kinds = ['all', 'branch', 'clan', 'subclan', 'family', 'house'] as const;
type Kind = (typeof kinds)[number];

const typeNames: Record<string, [string, string]> = {
  branch: ['فرع', 'Branch'],
  clan: ['بطن', 'Clan'],
  subclan: ['فخذ', 'Subclan'],
  family: ['عائلة', 'Family'],
  house: ['بيت', 'House'],
};

function nameOf(unit: PublicUnit, ar: boolean) {
  return (ar ? unit.name_ar : unit.name_en || unit.name_ar);
}

function typeOf(type: string, ar: boolean) {
  return typeNames[type]?.[ar ? 0 : 1] || type;
}

function ExplorerNode({
  node, ar, expanded, autoOpen, selectedId, onToggle, onSelect,
}: {
  node: LineageNode;
  ar: boolean;
  expanded: ReadonlySet<string>;
  autoOpen: boolean;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const open = autoOpen || expanded.has(node.unit.id);
  const hasChildren = node.children.length > 0;
  return <li className="lx-tree-li">
    <div className={'lx-node' + (selectedId === node.unit.id ? ' lx-node-selected' : '')}>
      <span className={'lx-node-symbol lx-type-' + node.unit.unit_type}><GitBranch size={19} aria-hidden="true" /></span>
      <button type="button" className="lx-node-main" onClick={() => onSelect(node.unit.id)}
        aria-label={(ar ? 'عرض تفاصيل ' : 'View details of ') + nameOf(node.unit, ar)}>
        <span className="lx-node-name">{nameOf(node.unit, ar)}</span>
        <span className="lx-node-meta">{typeOf(node.unit.unit_type, ar)} · {ar ? 'معتمد للنشر' : 'Approved for display'}</span>
      </button>
      {hasChildren && <span className="lx-node-count" aria-label={(ar ? 'وحدات فرعية: ' : 'Child units: ') + node.children.length}>{node.children.length}</span>}
      {hasChildren && <button type="button" className="lx-node-toggle" aria-label={(open ? (ar ? 'طي ' : 'Collapse ') : (ar ? 'توسيع ' : 'Expand ')) + nameOf(node.unit, ar)}
        aria-expanded={open} aria-controls={'lx-children-' + node.unit.id}
        onClick={() => onToggle(node.unit.id)} disabled={autoOpen}>
        <ChevronDown size={18} aria-hidden="true" />
      </button>}
    </div>
    {hasChildren && open && <ul id={'lx-children-' + node.unit.id} className="lx-children">
      {node.children.map(child => <ExplorerNode key={child.unit.id}
        node={child} ar={ar} expanded={expanded} autoOpen={autoOpen}
        selectedId={selectedId} onToggle={onToggle} onSelect={onSelect} />)}
    </ul>}
  </li>;
}

export function LineageExplorer({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const copy = ar ? {
    eyebrow: 'ديوان الحازمي / دليل الأنساب', title: 'جذورنا، قصة تجمعنا',
    description: 'اكتشف الفروع والبطون والأفخاذ والعوائل في عرض تفاعلي، مع الحفاظ على تسلسل الأنساب المعتمدة للنشر.',
    verified: 'بيانات معتمدة للنشر', notOfficial: 'مرجع مجتمعي غير رسمي',
    units: 'وحدة نسب', branches: 'الفروع', clans: 'البطون', subclans: 'الأفخاذ', families: 'العوائل',
    navigate: 'استكشف الأنساب', roots: 'جذور الشجرة', allRoots: 'جميع الفروع',
    search: 'ابحث عن فخذ أو عائلة أو فرع…', filters: 'تصفية حسب النوع', allKinds: 'كل الأنواع',
    explore: 'مستكشف الأنساب', tree: 'الشجرة', list: 'القائمة', expand: 'توسيع الكل', collapse: 'طي الكل',
    refresh: 'تحديث البيانات', loading: 'جارٍ جلب البيانات المعتمدة', loaded: 'وحدة تم تحميلها',
    noResults: 'لم نجد وحدات مطابقة للبحث أو الفلتر.', clear: 'مسح البحث والتصفية',
    noData: 'لا توجد وحدات نسب معتمدة للنشر حاليًا.', error: 'تعذر تحميل جميع البيانات. جرّب التحديث.',
    more: 'تحميل المزيد', detail: 'بطاقة النسب', select: 'اختر وحدة من الشجرة لعرض تفاصيلها',
    direct: 'وحدة تابعة مباشرة', descendants: 'وحدة ضمن التفرعات', path: 'المسار في الشجرة',
    parent: 'الوحدة الأم', top: 'وحدة جذرية', privacy: 'لا تُعرض بيانات الأشخاص والوثائق الخاصة في الدليل العام.',
    share: 'نسخ رابط الوحدة', copied: 'تم نسخ الرابط', matched: 'نتيجة مطابقة', shown: 'وحدة معروضة',
    reviewed: 'تُعرض الوحدات الموافق على نشرها فقط، ولا يُعد هذا إثباتًا رسميًا للنسب.',
    view: 'طريقة العرض',
  } : {
    eyebrow: 'Alhazmi Diwan / Genealogy', title: 'Our roots, our shared story',
    description: 'Explore approved branches, clans, subclans, and families in an interactive, navigable hierarchy.',
    verified: 'Approved for publication', notOfficial: 'Independent community reference',
    units: 'lineage units', branches: 'Branches', clans: 'Clans', subclans: 'Subclans', families: 'Families',
    navigate: 'Explore genealogy', roots: 'Tree roots', allRoots: 'All branches',
    search: 'Search a branch, clan, or family…', filters: 'Filter by type', allKinds: 'All types',
    explore: 'Lineage explorer', tree: 'Tree', list: 'List', expand: 'Expand all', collapse: 'Collapse all',
    refresh: 'Refresh data', loading: 'Loading approved records', loaded: 'units loaded',
    noResults: 'No units match these search filters.', clear: 'Clear filters',
    noData: 'There are no approved public lineage units yet.', error: 'Some records could not be loaded. Try refreshing.',
    more: 'Load more', detail: 'Unit details', select: 'Select a unit to see its details',
    direct: 'direct children', descendants: 'descendant units', path: 'Position in the hierarchy',
    parent: 'Parent unit', top: 'Root unit', privacy: 'Personal records and private documents are not displayed here.',
    share: 'Copy unit link', copied: 'Link copied', matched: 'matching results', shown: 'units shown',
    reviewed: 'Only publication-approved units appear. This is not official ancestry certification.',
    view: 'View mode',
  };

  const [units, setUnits] = useState<PublicUnit[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [rootId, setRootId] = useState('all');
  const [mode, setMode] = useState<Mode>('tree');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadApprovedLineage(
      offset => getPublicLineage(offset, controller.signal),
      (loaded, cursor) => {
        if (!controller.signal.aborted) {
          setUnits(loaded);
          setNextOffset(cursor);
        }
      },
    ).then(result => {
      if (controller.signal.aborted) return;
      setUnits(result.items);
      setNextOffset(result.nextOffset);
      const tree = buildLineageTree(result.items);
      setExpanded(new Set(tree.map(node => node.unit.id)));
      const param = new URLSearchParams(window.location.search).get('unit');
      const deepLink = result.items.some(item => item.id === param) ? param : null;
      setSelectedId(current => current && result.items.some(item => item.id === current)
        ? current : deepLink || tree[0]?.unit.id || null);
      if (deepLink) {
        setExpanded(previous => new Set([
          ...previous, ...ancestryOf(deepLink, result.items).map(item => item.id),
        ]));
      }
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [reloadKey]);

  const tree = useMemo(() => buildLineageTree(units), [units]);
  const counts = useMemo(() => lineageTypeCounts(units), [units]);
  const index = useMemo(() => new Map(units.map(item => [item.id, item])), [units]);
  const selected = selectedId ? index.get(selectedId) : undefined;
  const path = useMemo(() => selectedId ? ancestryOf(selectedId, units) : [], [selectedId, units]);
  const selectedNode = useMemo(() => selectedId ? findLineageNode(tree, selectedId) : undefined, [tree, selectedId]);

  const rootTree = useMemo(() => {
    if (rootId === 'all') return tree;
    const node = findLineageNode(tree, rootId);
    return node ? [node] : tree;
  }, [tree, rootId]);

  const rootScope = useMemo(() => {
    const ids = new Set<string>();
    const visit = (node: LineageNode) => {
      ids.add(node.unit.id);
      node.children.forEach(visit);
    };
    rootTree.forEach(visit);
    return ids;
  }, [rootTree]);

  const normalizedQuery = normalizeArabic(query);
  const hasFilters = !!normalizedQuery || kind !== 'all';
  const matches = (unit: PublicUnit) =>
    (kind === 'all' || unit.unit_type === kind)
    && (!normalizedQuery || normalizeArabic(unit.name_ar + ' ' + (unit.name_en || '')).includes(normalizedQuery));
  const visibleUnits = units.filter(unit => rootScope.has(unit.id) && matches(unit));
  const visibleTree = hasFilters ? pruneLineageTree(rootTree, matches) : rootTree;

  function selectUnit(id: string) {
    setSelectedId(id);
    setCopied(false);
    setExpanded(previous => new Set([...previous, ...ancestryOf(id, units).map(unit => unit.id)]));
    const url = new URL(window.location.href);
    url.searchParams.set('unit', id);
    window.history.replaceState(null, '', url.toString());
  }

  function selectRoot(id: string) {
    setRootId(id);
    if (id !== 'all') selectUnit(id);
  }

  function refresh() {
    setLoading(true);
    setError(false);
    setUnits([]);
    setNextOffset(null);
    setExpanded(new Set());
    setReloadKey(key => key + 1);
  }

  async function more() {
    if (nextOffset === null || loadingMore) return;
    const offset = nextOffset;
    setLoadingMore(true);
    setError(false);
    try {
      const page = await getPublicLineage(offset);
      if (page.meta.reviewStatus !== 'approved' || page.meta.offset !== offset
        || (page.meta.nextOffset !== null && page.meta.nextOffset <= offset)) throw new Error('INVALID_APPROVED_PAGE');
      setUnits(old => [...new Map([...old, ...page.data].map(item => [item.id, item])).values()]);
      setNextOffset(page.meta.nextOffset);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  function expandAll() { setExpanded(new Set(units.map(unit => unit.id))); }
  function collapseAll() { setExpanded(new Set()); }
  function toggle(id: string) {
    setExpanded(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyLink() {
    if (!selected || !navigator.clipboard) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('unit', selected.id);
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
    } catch { setCopied(false); }
  }

  return <div className="lineage-v2">
    <div className="lx-breadcrumb">
      <Link href={'/' + locale}><House size={16} aria-hidden="true" /> {ar ? 'الرئيسية' : 'Home'}</Link>
      <span aria-hidden="true">/</span>
      <span>{ar ? 'شجرة الأنساب' : 'Genealogy tree'}</span>
    </div>

    <section className="lx-hero" aria-labelledby="lx-title">
      <div className="lx-hero-decor" aria-hidden="true"><span/><span/><span/><span/><span/></div>
      <div className="lx-hero-content">
        <div className="lx-hero-eyebrow"><Sparkles size={17} aria-hidden="true" /> {copy.eyebrow}</div>
        <h1 id="lx-title">{copy.title}</h1>
        <p>{copy.description}</p>
        <div className="lx-hero-pills">
          <span><ShieldCheck size={16} aria-hidden="true" /> {copy.verified}</span>
          <span><BookOpen size={16} aria-hidden="true" /> {copy.notOfficial}</span>
        </div>
        <a className="lx-hero-cta" href="#lineage-explore">{copy.navigate} <ArrowLeft size={18} aria-hidden="true" /></a>
      </div>
      <div className="lx-hero-art" aria-hidden="true">
        <div className="lx-art-orbit lx-art-orbit-one"/>
        <div className="lx-art-orbit lx-art-orbit-two"/>
        <div className="lx-art-icon"><Network size={72} strokeWidth={1.35} /></div>
        <span className="lx-art-dot lx-art-dot-one"/><span className="lx-art-dot lx-art-dot-two"/><span className="lx-art-dot lx-art-dot-three"/>
      </div>
    </section>

    <section className="lx-stats" aria-label={ar ? 'إحصائيات وحدات النسب المحملة' : 'Loaded approved lineage statistics'}>
      {([
        { key: 'total', icon: Network, value: units.length, label: copy.units },
        { key: 'branch', icon: Compass, value: counts.branch || 0, label: copy.branches },
        { key: 'subclan', icon: GitBranch, value: counts.subclan || 0, label: copy.subclans },
        { key: 'family', icon: FolderTree, value: counts.family || 0, label: copy.families },
      ] as const).map(stat => <div className="lx-stat" key={stat.key}>
        <div className="lx-stat-icon"><stat.icon size={21} aria-hidden="true" /></div>
        <div><strong>{stat.value.toLocaleString(ar ? 'ar-SA' : 'en-US')}</strong><span>{stat.label}</span></div>
      </div>)}
    </section>

    <section className="lx-workspace" id="lineage-explore" aria-label={copy.explore}>
      <aside className="lx-sidebar">
        <div className="lx-aside-head"><span className="lx-aside-glyph"><Compass size={20} aria-hidden="true" /></span>
          <div><h2>{copy.roots}</h2><p>{ar ? 'اختر فرعًا لاستعراض تفرعاته' : 'Choose a branch to explore'}</p></div>
        </div>
        <div className="lx-root-list">
          <button type="button" className={'lx-root-button' + (rootId === 'all' ? ' is-active' : '')}
            onClick={() => selectRoot('all')}>
            <LayoutGrid size={18} aria-hidden="true" /><span>{copy.allRoots}</span><b>{units.length}</b>
          </button>
          {tree.map(root => <button type="button" key={root.unit.id}
            className={'lx-root-button' + (rootId === root.unit.id ? ' is-active' : '')}
            onClick={() => selectRoot(root.unit.id)}>
            <GitBranch size={18} aria-hidden="true" /><span>{nameOf(root.unit, ar)}</span>
            <b>{countDescendants(root) + 1}</b>
          </button>)}
        </div>
        <div className="lx-aside-note"><ShieldCheck size={18} aria-hidden="true"/><p>{copy.reviewed}</p></div>
      </aside>

      <div className="lx-center">
        <div className="lx-section-title">
          <div><span className="lx-section-kicker">{ar ? 'سجل معتمد' : 'Verified directory'}</span>
            <h2><Network size={23} aria-hidden="true" /> {copy.explore}</h2></div>
          <button type="button" className="lx-icon-button" onClick={refresh} disabled={loading || loadingMore} title={copy.refresh} aria-label={copy.refresh}><RefreshCw size={19} aria-hidden="true" /></button>
        </div>

        <div className="lx-search-box">
          <Search size={20} aria-hidden="true"/>
          <input type="search" value={query} maxLength={100} placeholder={copy.search}
            aria-label={copy.search} onChange={e => setQuery(e.target.value)} />
          {!!query && <button type="button" onClick={() => setQuery('')} aria-label={copy.clear}><X size={18}/></button>}
        </div>

        <div className="lx-kind-tabs" aria-label={copy.filters}>
          {kinds.map(value => <button type="button" key={value} aria-pressed={kind === value}
            onClick={() => setKind(value)} className={kind === value ? 'is-active' : ''}>
            {value === 'all' ? copy.allKinds : typeOf(value, ar)}
          </button>)}
        </div>

        <div className="lx-results-toolbar">
          <div className="lx-results-count">
            <span className="lx-live-dot" aria-hidden="true"/>
            {visibleUnits.length.toLocaleString(ar ? 'ar-SA' : 'en-US')} {hasFilters ? copy.matched : copy.shown}
          </div>
          <div className="lx-switcher" role="group" aria-label={copy.view}>
            <button type="button" aria-pressed={mode === 'tree'} className={mode === 'tree' ? 'is-active' : ''} onClick={() => setMode('tree')}><GitBranch size={16} /> {copy.tree}</button>
            <button type="button" aria-pressed={mode === 'list'} className={mode === 'list' ? 'is-active' : ''} onClick={() => setMode('list')}><List size={17} /> {copy.list}</button>
          </div>
        </div>

        {!hasFilters && mode === 'tree' && <div className="lx-tree-actions">
          <button type="button" onClick={expandAll} disabled={loading}>{copy.expand}</button>
          <button type="button" onClick={collapseAll} disabled={loading}>{copy.collapse}</button>
        </div>}

        {loading && <div className="lx-state-card" role="status">
          <div className="lx-spinner" aria-hidden="true"/><strong>{copy.loading}</strong>
          <p>{units.length.toLocaleString(ar ? 'ar-SA' : 'en-US')} {copy.loaded}</p>
          <div className="lx-progress-track"><div className="lx-progress-indeterminate"/></div>
        </div>}
        {error && <div className="lx-state-card lx-state-error" role="alert">
          <strong>{copy.error}</strong><button type="button" onClick={refresh}>{copy.refresh}</button>
        </div>}
        {!loading && units.length === 0 && !error && <div className="lx-state-card"><FolderTree size={28}/><p>{copy.noData}</p></div>}
        {!loading && units.length > 0 && visibleUnits.length === 0 && <div className="lx-state-card">
          <Search size={26} aria-hidden="true"/><strong>{copy.noResults}</strong>
          <button type="button" onClick={() => { setQuery(''); setKind('all'); setRootId('all'); }}>{copy.clear}</button>
        </div>}

        {!loading && visibleUnits.length > 0 && mode === 'tree' && <ul className="lx-tree-list">
          {visibleTree.map(node => <ExplorerNode key={node.unit.id} node={node} ar={ar}
            expanded={expanded} autoOpen={hasFilters} selectedId={selectedId}
            onSelect={selectUnit} onToggle={toggle}/>)}
        </ul>}
        {!loading && visibleUnits.length > 0 && mode === 'list' && <div className="lx-card-list">
          {visibleUnits.map(unit => <button type="button" className={'lx-list-card' + (selectedId === unit.id ? ' is-selected' : '')}
            key={unit.id} onClick={() => selectUnit(unit.id)}>
            <span className="lx-list-icon"><FolderTree size={19}/></span>
            <span><strong>{nameOf(unit, ar)}</strong><small>{typeOf(unit.unit_type, ar)}</small></span>
            <ArrowLeft size={18} aria-hidden="true"/>
          </button>)}
        </div>}
        {nextOffset !== null && !loading && <button type="button" className="lx-more" disabled={loadingMore} onClick={more}>
          {loadingMore ? copy.loading : copy.more}<ChevronDown size={17} aria-hidden="true"/>
        </button>}
      </div>

      <aside className="lx-detail-sidebar">
        <div className="lx-detail-head">
          <span><BookOpen size={20} aria-hidden="true"/></span><h2>{copy.detail}</h2>
        </div>
        {selected ? <>
          <div className="lx-detail-profile">
            <div className="lx-detail-avatar"><GitBranch size={30} aria-hidden="true"/></div>
            <span className="lx-detail-type">{typeOf(selected.unit_type, ar)}</span>
            <h3>{nameOf(selected, ar)}</h3>
            <div className="lx-verified"><Check size={15} aria-hidden="true"/> {copy.verified}</div>
          </div>
          <div className="lx-detail-divider"/>
          <div className="lx-detail-metrics">
            <div><strong>{selectedNode?.children.length || 0}</strong><span>{copy.direct}</span></div>
            <div><strong>{selectedNode ? countDescendants(selectedNode) : 0}</strong><span>{copy.descendants}</span></div>
          </div>
          <h4 className="lx-detail-label">{copy.path}</h4>
          <nav className="lx-path" aria-label={copy.path}>
            {path.map((unit, i) => <div key={unit.id} className="lx-path-item">
              <span className="lx-path-index">{i + 1}</span>
              <button type="button" onClick={() => selectUnit(unit.id)}
                aria-current={unit.id === selectedId ? 'location' : undefined}>{nameOf(unit, ar)}</button>
            </div>)}
          </nav>
          <div className="lx-detail-parent">
            <small>{copy.parent}</small>
            <strong>{path.length > 1 ? nameOf(path[path.length - 2], ar) : copy.top}</strong>
          </div>
          <button className="lx-copy" type="button" onClick={copyLink}>
            {copied ? <Check size={17} aria-hidden="true"/> : <Copy size={17} aria-hidden="true" />}
            {copied ? copy.copied : copy.share}
          </button>
        </> : <div className="lx-detail-placeholder"><Compass size={29} aria-hidden="true"/><p>{copy.select}</p></div>}
        <p className="lx-detail-privacy"><ShieldCheck size={17} aria-hidden="true"/>{copy.privacy}</p>
      </aside>
    </section>
  </div>;
}
