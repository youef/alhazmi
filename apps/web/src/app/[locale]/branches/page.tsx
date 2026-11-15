import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComingSection } from '@/components/coming-section';
import { getDictionary, isLocale } from '@/lib/i18n';
export default async function BranchesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return <ComingSection locale={locale} title={t.branchesTitle} description={t.branchesDesc}/>;
}
