'use client';

import { useEffect, useMemo, useState } from 'react';
import { GitBranch, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { getPublicLineage, type PublicUnit } from '@/lib/diwan-api';

export function LiveLineageDirectory({ locale, view }: { locale: Locale; view: 'branches' | 'lineage' }) {
  const ar = locale === 'ar';
  const [items, setItems] = useState<PublicUnit[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false); setItems([]); setNextOffset(null);
    getPublicLineage(0, controller.signal)
      .then(page => { if (!controller.signal.aborted) { setItems(page.data); setNextOffset(page.meta.nextOffset); } })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [nonce]);

  async function more() {
    if (nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getPublicLineage(nextOffset);
      setItems(old => [...old, ...page.data]);
      setNextOffset(page.meta.nextOffset);
    } catch { setError(true); }
    finally { setLoadingMore(false); }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return items.filter(item => !term || item.name_ar.toLocaleLowerCase().includes(term) || item.name_en?.toLocaleLowerCase().includes(term));
  }, [items, search]);

  return <section className="directory-shell" aria-label={ar ? 'دليل الأنساب المعتمدة' : 'Approved genealogy directory'}>
    <div className="directory-policy"><ShieldCheck size={18} aria-hidden="true"/>
      <span>{ar ? 'لا تُعرض إلا وحدات النسب التي اكتملت مراجعتها واعتمادها. البيانات التاريخية قيد المراجعة ليست معتمدة.' : 'Only reviewer-approved genealogy records are shown. Historical draft records are not certified.'}</span>
    </div>
    <div className="directory-toolbar">
      <div className="directory-search"><Search size={18} aria-hidden="true"/><input aria-label={ar ? 'البحث بالأفخاذ والعوائل' : 'Search branches and families'} value={search} onChange={event=>setSearch(event.target.value)} placeholder={ar ? 'ابحث عن فخذ أو عائلة معتمدة...' : 'Search approved branches and families...'} /></div>
      <button className="directory-retry" type="button" onClick={()=>setNonce(value=>value+1)}><RefreshCw size={17}/>{ar ? 'تحديث' : 'Refresh'}</button>
    </div>
    {loading ? <p role="status" className="directory-state">{ar ? 'جارٍ تحميل البيانات المعتمدة من Neon...' : 'Loading approved Neon records...'}</p>
      : error ? <p role="alert" className="directory-state">{ar ? 'تعذر الوصول إلى خدمة البيانات. قد يكون تحديث Neon Functions لم يُنشر بعد؛ لا نعرض بيانات تجريبية بدلًا عنها.' : 'The data service is unavailable or not yet deployed. No fake records are shown.'}</p>
      : items.length === 0 ? <p role="status" className="directory-state">{ar ? 'لا توجد وحدات نسب معتمدة للنشر حتى الآن؛ السجلات المستوردة تنتظر المراجعة.' : 'No lineage units have been approved for public publication yet.'}</p>
      : filtered.length === 0 ? <p className="directory-state">{ar ? 'لا توجد نتائج ضمن السجلات المحمّلة.' : 'No results in the records loaded so far.'}</p>
      : <div className="directory-list">{filtered.map(item=><article className="directory-item" key={item.id}>
          <div className="directory-icon"><GitBranch size={20}/></div>
          <div><h2>{!ar && item.name_en ? item.name_en : item.name_ar}</h2><p>{item.unit_type} · {ar ? 'معتمد' : 'Approved'}</p></div>
          {view === 'lineage' && item.parent_id && items.find(p=>p.id===item.parent_id)
            ? <span className="directory-parent">{ar ? 'يتبع' : 'Parent'}: {items.find(p=>p.id===item.parent_id)?.name_ar}</span> : null}
        </article>)}</div>}
    {nextOffset !== null && !loading && !error && <button type="button" disabled={loadingMore} className="directory-load-more" onClick={more}>{loadingMore ? (ar ? 'جارٍ التحميل...' : 'Loading...') : (ar ? 'تحميل المزيد' : 'Load more')}</button>}
    <p className="directory-footnote">{ar ? 'قد لا يشمل البحث جميع السجلات حتى تحميل بقية الصفحات. بيانات الأفراد لا تُعرض للعامة.' : 'Search covers loaded records only. Private individual records are never public.'}</p>
  </section>;
}
