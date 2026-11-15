import { notFound } from 'next/navigation';
import { LiveLineageDirectory } from '@/components/live-lineage-directory';
import { getDictionary, isLocale } from '@/lib/i18n';
export default async function LineagePage({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 if (!isLocale(locale)) notFound();
 const t = getDictionary(locale);
 return <main className="container inner-page">
   <h1>{t.lineageTitle}</h1><p className="inner-lead">{t.lineageDesc}</p>
   <LiveLineageDirectory locale={locale} view="lineage" />
 </main>;
}
