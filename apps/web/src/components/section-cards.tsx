import Link from 'next/link';
import { BookOpenText, Files, GitBranch, UsersRound, ArrowUpLeft } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/i18n';

export function SectionCards({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const sections = [
    { href: '/branches', label: t.branchesTitle, description: t.branchesDesc, Icon: UsersRound, index: '01' },
    { href: '/lineage', label: t.lineageTitle, description: t.lineageDesc, Icon: GitBranch, index: '02' },
    { href: '/archive', label: t.archiveTitle, description: t.archiveDesc, Icon: Files, index: '03' },
    { href: '/history', label: t.historyTitle, description: t.historyDesc, Icon: BookOpenText, index: '04' },
  ];
  return <div className="section-grid">{sections.map(({href,label,description,Icon,index}) =>
    <Link key={href} href={`/${locale}${href}`} className="section-card">
      <div className="card-top"><span className="card-icon"><Icon size={25} strokeWidth={1.6}/></span><span className="card-index">{index}</span></div>
      <h3>{label}</h3><p>{description}</p>
      <span className="card-arrow"><ArrowUpLeft size={19} aria-hidden="true" /></span>
    </Link>
  )}</div>;
}
