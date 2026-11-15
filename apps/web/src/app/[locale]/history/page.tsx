import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HistoryContent } from './history-content';
import { isLocale } from '@/lib/i18n';
import './history-page.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ar = locale === 'ar';
  return {
    title: ar ? 'تاريخ قبيلة الحازم من الفدعان من عنزة' : 'Hazm tribe history — Fad’an of Anaza',
    description: ar
      ? 'تاريخ الحازم من الفدعان من عنزة: الأصل والنسب، الضوامرة والقريشم، الأفخاذ، الروايات، المشيخة التاريخية والشخصيات ومناطق الانتشار مع المراجع.'
      : 'Referenced history of the Hazm of the Fad’an and Anaza: origins, Dhawamir and Quraishim, family divisions, figures and historical geography.',
  };
}

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <main id="main-content" className="container inner-page">
    <HistoryContent locale={locale} />
  </main>;
}
