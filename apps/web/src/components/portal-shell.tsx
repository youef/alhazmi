import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/site-header';
import { direction, getDictionary, type Locale } from '@/lib/i18n';
import type { ReactNode } from 'react';

export function PortalShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const ar = locale === 'ar';
  const t = getDictionary(locale);
  return <div className="site-root" lang={locale} dir={direction(locale)}>
    <a className="skip-link" href="#main-content">{ar ? 'تجاوز التنقل' : 'Skip to content'}</a>
    <SiteHeader locale={locale} />
    {children}
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-label"><Image unoptimized src="https://youef.github.io/alhazmi/brand/diwan-emblem.webp" alt="" width="42" height="42" /><span>{t.footer}</span></div>
        <nav aria-label={ar ? 'روابط التذييل' : 'Footer links'}>
          <Link href={`/${locale}/history/`}>{t.nav.history}</Link>
          <Link href={`/${locale}/archive/`}>{t.nav.archive}</Link>
        </nav>
      </div>
    </footer>
  </div>;
}
