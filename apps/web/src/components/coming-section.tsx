import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/i18n';

export function ComingSection({ locale, title, description }: { locale: Locale; title: string; description: string }) {
  const t = getDictionary(locale);
  return <main className="container inner-page">
    <div className="inner-eyebrow"><ShieldCheck size={18} /> {t.editorial}</div>
    <h1>{title}</h1><p className="inner-lead">{description}</p>
    <div className="coming-card">
      <span className="pill">{t.soon}</span><h2>{t.coming}</h2><p>{t.comingBody}</p>
      <Link className="text-link" href={`/${locale}`}>{t.returnHome}</Link>
    </div>
  </main>;
}
