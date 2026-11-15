import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/i18n';

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const entries = [
    { path: '', label: t.nav.home },
    { path: '/history', label: t.nav.history },
    { path: '/branches', label: t.nav.branches },
    { path: '/lineage', label: t.nav.lineage },
    { path: '/archive', label: t.nav.archive },
  ];
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href={`/${locale}`} aria-label={t.brand}>
          <span className="brand-seal" aria-hidden="true">ح</span>
          <span className="brand-name"><strong>{t.brand}</strong><small>{t.eyebrow}</small></span>
        </Link>
        <nav className="main-nav" aria-label={locale === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
          {entries.map((entry) => <Link key={entry.path} href={`/${locale}${entry.path}`}>{entry.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="language-switch" href={locale === 'ar' ? '/en' : '/ar'} hrefLang={locale === 'ar' ? 'en' : 'ar'}>{locale === 'ar' ? 'EN' : 'عربي'}</Link>
        </div>
      </div>
    </header>
  );
}
