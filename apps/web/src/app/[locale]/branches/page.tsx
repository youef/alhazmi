import { notFound } from 'next/navigation';
import { LiveLineageDirectory } from '@/components/live-lineage-directory';
import { getDictionary, isLocale } from '@/lib/i18n';
export default async function BranchesPage({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 if (!isLocale(locale)) notFound();
 const t = getDictionary(locale);
 return <main className="container inner-page">
   <h1>{t.branchesTitle}</h1><p className="inner-lead">{t.branchesDesc}</p>
   <LiveLineageDirectory locale={locale} view="branches" />
 </main>;
}
