import { notFound } from 'next/navigation';
import { ComingSection } from '@/components/coming-section';
import { isLocale } from '@/lib/i18n';
export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  return <ComingSection locale={locale} section="history" />;
}
