import Link from 'next/link';
import { Archive, BookOpenText, GitBranch, House, UsersRound } from 'lucide-react';
import { getDictionary, type Locale } from '@/lib/i18n';

const icons = { branches: UsersRound, lineage: GitBranch, history: BookOpenText, archive: Archive };

export function SectionHeader({ locale, section, title, description }: {
  locale: Locale;
  section: keyof typeof icons;
  title: string;
  description: string;
}) {
  const ar = locale === 'ar';
  const t = getDictionary(locale);
  const Icon = icons[section];
  return <header className="area-header">
    <nav aria-label={ar ? 'مسار الصفحة' : 'Breadcrumb'}>
      <Link href={`/${locale}/`}><House size={15} aria-hidden="true" />{t.nav.home}</Link>
      <span aria-hidden="true">/</span><span aria-current="page">{t.nav[section]}</span>
    </nav>
    <div className="area-heading">
      <span className="area-icon"><Icon size={30} aria-hidden="true" /></span>
      <div><h1>{title}</h1><p className="inner-lead">{description}</p></div>
    </div>
  </header>;
}
