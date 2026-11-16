'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Archive, BookOpenText, GitBranch, Globe2, CircleUserRound, House, Moon, Sun, UsersRound } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { getDictionary, type Locale } from '@/lib/i18n';
import { assetUrl, memberPortalUrl } from '@/lib/site';
const themeEvent = 'diwan-theme';
function subscribe(listener: () => void) {
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  preference.addEventListener('change', listener);
  window.addEventListener(themeEvent, listener);
  return () => {
    preference.removeEventListener('change', listener);
    window.removeEventListener(themeEvent, listener);
  };
}
function themeSnapshot() {
  const current = document.documentElement.dataset.theme;
  return current ? current === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}
const initialTheme = () => false;

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname().replace(/\/$/, '');
  const dark = useSyncExternalStore(subscribe, themeSnapshot, initialTheme);
  const t = getDictionary(locale);
  const ar = locale === 'ar';
  const nextLocale = ar ? 'en' : 'ar';
  const suffix = pathname.replace(/^\/(ar|en)(?=\/|$)/, '');
  const entries = [
    { path: '', label: t.nav.home, Icon: House },
    { path: '/branches', label: t.nav.branches, Icon: UsersRound },
    { path: '/lineage', label: t.nav.lineage, Icon: GitBranch },
    { path: '/history', label: t.nav.history, Icon: BookOpenText },
    { path: '/archive', label: t.nav.archive, Icon: Archive },
  ];
  const themeLabel = dark ? (ar ? 'الوضع النهاري' : 'Light mode') : (ar ? 'الوضع الليلي' : 'Dark mode');
  function toggleTheme() {
    const value = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = value;
    try { localStorage.setItem('diwan-theme', value); } catch {}
    window.dispatchEvent(new Event(themeEvent));
  }

  return <header className="site-header">
    <div className="utility-bar"><div className="container utility-inner">
      <span>{ar ? 'مبادرة أهلية مستقلة' : 'Independent community initiative'}</span>
      <div className="header-actions">
        <a className="utility-action" href={memberPortalUrl}><CircleUserRound size={17} aria-hidden="true" />{ar ? 'حسابي' : 'My account'}</a>
        <Link className="utility-action" href={`/${nextLocale}${suffix}/`} hrefLang={nextLocale} lang={nextLocale}>
          <Globe2 size={17} aria-hidden="true" />{ar ? 'English' : 'العربية'}
        </Link>
        <button className="utility-action" type="button" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
          {dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
        </button>
      </div>
    </div></div>
    <div className="container header-inner">
      <Link className="brand" href={`/${locale}/`}>
        <span className="brand-seal"><Image unoptimized src={assetUrl('/brand/diwan-emblem.webp')} alt="" width="52" height="52" /></span>
        <span className="brand-name"><strong>{t.brand}</strong><small>{t.eyebrow}</small></span>
      </Link>
      <nav className="main-nav" aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'}>
        {entries.map(({path, label, Icon}) => {
          const active = pathname === `/${locale}${path}` || (!pathname && !path);
          return <Link key={path} href={`/${locale}${path}/`} aria-current={active ? 'page' : undefined}>
            <Icon size={18} aria-hidden="true" />{label}
          </Link>;
        })}
      </nav>
    </div>
  </header>;
}
