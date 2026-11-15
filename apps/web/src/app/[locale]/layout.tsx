import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { direction, getDictionary, isLocale, locales } from '@/lib/i18n';

type Props = { children: ReactNode; params: Promise<{ locale: string }> };
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Props['params'] }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: { default: t.brand, template: `%s | ${t.brand}` }, description: t.heroBody };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return <div className="site-root" lang={locale} dir={direction(locale)}>
    <SiteHeader locale={locale}/>
    {children}
    <footer className="footer"><div className="container footer-inner"><span>{t.footer}</span><span>{t.privacy}</span></div></footer>
  </div>;
}
