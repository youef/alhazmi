import { SectionHeader } from '@/components/section-header';
import { notFound } from 'next/navigation';
import { LiveLineageDirectory } from '@/components/live-lineage-directory';
import { isLocale } from '@/lib/i18n';
export default async function LineagePage({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 if (!isLocale(locale)) notFound();
 return <main id="main-content" className="container inner-page">
   <SectionHeader locale={locale} section="lineage" title={locale === 'ar' ? 'شجرة وحدات النسب' : 'Lineage unit tree'}
     description={locale === 'ar' ? 'تصفّح التسلسل بين الفروع والأفخاذ والعوائل المصرّح بنشرها.' : 'Explore the hierarchy of branches and families approved for publication.'} />
   <LiveLineageDirectory locale={locale} view="lineage" />
 </main>;
}
