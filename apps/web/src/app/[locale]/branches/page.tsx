import { SectionHeader } from '@/components/section-header';
import { notFound } from 'next/navigation';
import { LiveLineageDirectory } from '@/components/live-lineage-directory';
import { getDictionary, isLocale } from '@/lib/i18n';
export default async function BranchesPage({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 if (!isLocale(locale)) notFound();
 const t = getDictionary(locale);
 return <main id="main-content" className="container inner-page">
   <SectionHeader locale={locale} section="branches" title={t.branchesTitle} description={t.branchesDesc} />
   <LiveLineageDirectory locale={locale} view="branches" />
 </main>;
}
