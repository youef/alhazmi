import Link from 'next/link';
import { Archive, BookOpenText, ChevronDown, FileSearch, ShieldCheck } from 'lucide-react';
import { SectionHeader } from '@/components/section-header';
import { getDictionary, type Locale } from '@/lib/i18n';

export function ComingSection({ locale, section }: { locale: Locale; section: 'history' | 'archive' }) {
  const ar = locale === 'ar';
  const t = getDictionary(locale);
  const history = section === 'history';
  const Icon = history ? BookOpenText : Archive;
  const title = history ? t.historyTitle : t.archiveTitle;
  const description = history ? t.historyDesc : t.archiveDesc;
  const emptyTitle = history
    ? (ar ? 'لا توجد روايات منشورة حاليًا' : 'No accounts have been published yet')
    : (ar ? 'لا توجد وثائق عامة حاليًا' : 'No public documents are available yet');

  const topics = history ? [
    {
      title: ar ? 'كيف تُوثّق الروايات التاريخية؟' : 'How are historical accounts documented?',
      body: ar ? 'تُراجع الرواية مع مصادرها ويُذكر مرجعها وتاريخها عند توفرهما. تُحفظ الروايات المتعارضة للمراجعة قبل عرضها.' : 'Accounts are reviewed against their sources, with references and dates included when available. Conflicting accounts are held for review before publication.',
    },
    {
      title: ar ? 'أين أجد الأنساب المعتمدة؟' : 'Where can I find approved lineage?',
      body: ar ? 'يعرض دليل النسب الفروع والأفخاذ والعوائل التي حصلت على اعتماد النشر.' : 'The lineage directory lists branches and families approved for publication.',
    },
  ] : [
    {
      title: ar ? 'ما أنواع المواد التي يشملها الأرشيف؟' : 'What kinds of materials does the archive cover?',
      body: ar ? 'يشمل الأرشيف الصور والمخطوطات والوثائق. يساعد الوصف والمصدر والتاريخ، عند توفرها، على فهم سياق كل مادة.' : 'The archive covers photographs, manuscripts and documents. Descriptions, provenance and dates provide context when available.',
    },
    {
      title: ar ? 'من يمكنه الاطلاع على الوثائق الخاصة؟' : 'Who can view private documents?',
      body: ar ? 'تبقى الوثائق الشخصية ضمن صلاحيات أصحابها والمخولين. يظهر في الأرشيف العام ما أُجيز نشره بعد المراجعة.' : 'Personal documents are limited to their owners and authorized users. The public archive shows items cleared for publication after review.',
    },
  ];

  return <main id="main-content" className="container inner-page">
    <SectionHeader locale={locale} section={section} title={title} description={description} />
    <div className="collection-layout">
      <section className="collection-panel" aria-labelledby="records-title">
        <span className="card-icon"><Icon size={24} aria-hidden="true" /></span>
        <h2 id="records-title">{emptyTitle}</h2>
        <p>{history
          ? (ar ? 'ستظهر الروايات هنا بعد اكتمال مراجعتها واعتماد نشرها.' : 'Accounts will appear here after review and publication approval.')
          : (ar ? 'ستظهر المواد هنا بعد مراجعة وصفها ومصدرها وصلاحية نشرها.' : 'Items will appear here after their descriptions, provenance and publication permissions are reviewed.')}</p>
        <Link className="text-link" href={`/${locale}/${history ? 'lineage' : 'history'}/`}>
          <FileSearch size={17} aria-hidden="true" />{history ? t.nav.lineage : t.nav.history}
        </Link>
      </section>
      <aside className="collection-panel" aria-labelledby="publication-title">
        <h2 id="publication-title"><ShieldCheck size={22} aria-hidden="true" />{ar ? 'المصادر وسياسة النشر' : 'Sources and publication'}</h2>
        {topics.map(topic => <details className="collection-question" key={topic.title}>
          <summary>{topic.title}<ChevronDown size={17} aria-hidden="true" /></summary>
          <p>{topic.body}</p>
        </details>)}
      </aside>
    </div>
  </main>;
}
