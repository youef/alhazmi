import { notFound } from 'next/navigation';
import { LineageExplorer } from '@/components/lineage-explorer';
import { isLocale } from '@/lib/i18n';
import './lineage-explorer.css';

export default async function LineagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <main id="main-content" className="container inner-page lineage-page">
    <LineageExplorer locale={locale} />
  </main>;
}
