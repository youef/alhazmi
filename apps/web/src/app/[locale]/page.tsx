import { notFound } from 'next/navigation';
import { PortalHome } from '@/components/portal-home';
import { isLocale } from '@/lib/i18n';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PortalHome locale={locale} />;
}
