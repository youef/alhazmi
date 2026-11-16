import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { ExternalLink, Github } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { direction, getDictionary, type Locale } from '@/lib/i18n';
import { assetUrl, memberPortalUrl, repositoryUrl } from '@/lib/site';

export function PortalShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const ar = locale === 'ar';
  const t = getDictionary(locale);
  const style = { '--hero-image': `url("${assetUrl('/brand/heritage-hero.webp')}")` } as CSSProperties;
  const sections = [
    { href: `/${locale}/branches/`, label: t.nav.branches },
    { href: `/${locale}/lineage/`, label: t.nav.lineage },
    { href: `/${locale}/history/`, label: t.nav.history },
    { href: `/${locale}/archive/`, label: t.nav.archive },
  ];
  return <div className="site-root" lang={locale} dir={direction(locale)} style={style}>
    <a className="skip-link" href="#main-content">{ar ? 'تجاوز التنقل' : 'Skip to content'}</a>
    <SiteHeader locale={locale} />
    {children}
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-about">
          <div className="footer-label"><Image unoptimized src={assetUrl('/brand/diwan-emblem.webp')} alt="" width="44" height="44" /><strong>{t.brand}</strong></div>
          <p>{t.footer}</p>
          <p className="footer-note">{t.editorial}</p>
        </div>
        <nav aria-label={ar ? 'أقسام الديوان' : 'Diwan sections'}>
          <h2>{t.sections}</h2>
          {sections.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <nav aria-label={ar ? 'روابط إضافية' : 'More links'}>
          <h2>{ar ? 'روابط' : 'Links'}</h2>
          <a href={memberPortalUrl}><ExternalLink size={15} aria-hidden="true" />{ar ? 'بوابة الأعضاء' : 'Members portal'}</a>
          <a href={repositoryUrl} rel="noopener"><Github size={15} aria-hidden="true" />{ar ? 'المشروع على GitHub' : 'Project on GitHub'}</a>
        </nav>
      </div>
    </footer>
  </div>;
}
