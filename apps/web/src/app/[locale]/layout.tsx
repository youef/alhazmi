import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PortalShell } from '@/components/portal-shell';
import { getDictionary, isLocale, locales } from '@/lib/i18n';
import { assetUrl, siteOrigin } from '@/lib/site';

type Props = { children: ReactNode; params: Promise<{ locale: string }> };
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Props['params'] }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const other = locale === 'ar' ? 'en' : 'ar';
  return {
    metadataBase: new URL(siteOrigin),
    title: { default: t.brand, template: `%s | ${t.brand}` },
    description: t.heroBody,
    alternates: { canonical: assetUrl(`/${locale}/`), languages: { ar: assetUrl('/ar/'), en: assetUrl('/en/'), 'x-default': assetUrl('/ar/') } },
    openGraph: { type: 'website', siteName: t.brand, title: t.brand, description: t.heroBody, locale: locale === 'ar' ? 'ar_SA' : 'en_US', alternateLocale: other === 'ar' ? 'ar_SA' : 'en_US', images: [{ url: assetUrl('/brand/heritage-hero.webp'), width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: t.brand, description: t.heroBody },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PortalShell locale={locale}>{children}</PortalShell>;
}
