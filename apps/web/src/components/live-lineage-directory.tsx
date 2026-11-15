'use client';

import { useEffect, useMemo, useState } from 'react';
import { GitBranch, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { getPublicLineage, type PublicUnit } from '@/lib/diwan-api';

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

  useEffect(() => {
    const controller = new AbortController();
    getPublicLineage(0, controller.signal, query)
      .then(page => { if (!controller.signal.aborted) { setItems(page.data); setNextOffset(page.meta.nextOffset); } })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [nonce, query]);

  function refresh() {
    setLoading(true);
    setError(false);
    setPageError(false);
    setItems([]);
    setNextOffset(null);
    setNonce(value => value + 1);
  }

  async function more() {
    if (nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    setPageError(false);
    try {
      const page = await getPublicLineage(nextOffset, undefined, query);
      setItems(old => [...old, ...page.data]);
      setNextOffset(page.meta.nextOffset);
    } catch { setPageError(true); }
    finally { setLoadingMore(false); }
  }

  const names = useMemo(() => new Map(items.map(item => [item.id, !ar && item.name_en ? item.name_en : item.name_ar])), [items, ar]);
  const types: Record<string, [string, string]> = {
    branch: ['فرع', 'Branch'], clan: ['بطن', 'Clan'], subclan: ['فخذ', 'Subclan'], family: ['عائلة', 'Family'], house: ['بيت', 'House'],
  };

  return <>
    <button className="directory-retry" type="button" onClick={refresh} disabled={loading || loadingMore}>
      <RefreshCw size={17} aria-hidden="true"/>{ar ? 'تحديث' : 'Refresh'}
    </button>
    {loading ? <p role="status" className="directory-state">{ar ? 'جارٍ تحميل البيانات المعتمدة من Neon...' : 'Loading approved Neon records...'}</p>
      : error ? <p role="alert" className="directory-state">{ar ? 'تعذر الوصول إلى خدمة البيانات. جرّب التحديث.' : 'The directory is unavailable. Try refreshing.'}</p>
      : items.length === 0 ? <p role="status" className="directory-state">{query ? (ar ? 'لا توجد نتائج مطابقة.' : 'No matching records.') : ar ? 'لا توجد وحدات نسب معتمدة للنشر حتى الآن؛ السجلات المستوردة تنتظر المراجعة.' : 'No lineage units have been approved for public publication yet.'}</p>
      : <div className="directory-list">{items.map(item=><article className="directory-item" key={item.id}>
          <div className="directory-icon"><GitBranch size={20}/></div>
          <div><h2>{!ar && item.name_en ? item.name_en : item.name_ar}</h2><p>{types[item.unit_type]?.[ar ? 0 : 1] ?? item.unit_type} · {ar ? 'معتمد' : 'Approved'}</p></div>
          {view === 'lineage' && item.parent_id && names.get(item.parent_id)
            ? <span className="directory-parent">{ar ? 'يتبع' : 'Parent'}: {names.get(item.parent_id)}</span> : null}
        </article>)}</div>}
    {pageError && <p role="alert" className="directory-state">{ar ? 'تعذر تحميل المزيد. حاول مجددًا.' : 'Could not load more records. Try again.'}</p>}
    {nextOffset !== null && !loading && !error && <button type="button" disabled={loadingMore} className="directory-load-more" onClick={more}>{loadingMore ? (ar ? 'جارٍ التحميل...' : 'Loading...') : (ar ? 'تحميل المزيد' : 'Load more')}</button>}
  </>;
}
