import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpenText, Files, GitBranch, UsersRound } from 'lucide-react';
import { getDictionary, type Locale } from '@/lib/i18n';

export function SectionCards({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const ar = locale === 'ar';
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const sections = [
    { href: '/branches', label: t.branchesTitle, description: ar ? 'ابحث في دليل الأفخاذ والعوائل المعتمدة.' : 'Search the directory of approved families and branches.', Icon: UsersRound },
    { href: '/lineage', label: t.lineageTitle, description: ar ? 'اطّلع على وحدات النسب المعتمدة للنشر.' : 'Explore lineage records approved for publication.', Icon: GitBranch },
    { href: '/history', label: t.historyTitle, description: ar ? 'تعرّف على قسم الروايات والمراجع التاريخية.' : 'Explore the history and source collections.', Icon: BookOpenText },
    { href: '/archive', label: t.archiveTitle, description: ar ? 'تعرّف على قسم الصور والمخطوطات والوثائق.' : 'Explore the documents, manuscripts and image archive.', Icon: Files },
  ];
  return <div className="section-grid">{sections.map(({href, label, description, Icon}) =>
    <Link key={href} href={`/${locale}${href}/`} className="section-card">
      <span className="card-icon"><Icon size={24} aria-hidden="true" /></span>
      <h3>{label}</h3>
      <p>{description}</p>
      <span className="card-arrow">{ar ? 'فتح القسم' : 'Open section'}<Arrow size={17} aria-hidden="true" /></span>
    </Link>)}</div>;
}
