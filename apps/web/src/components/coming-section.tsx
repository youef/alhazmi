import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpenText, Files, ShieldCheck } from 'lucide-react';
import { getDictionary, type Locale } from '@/lib/i18n';

export function ComingSection({ locale, section }: { locale: Locale; section: 'history' | 'archive' }) {
  const ar = locale === 'ar';
  const t = getDictionary(locale);
  const history = section === 'history';
  const Icon = history ? BookOpenText : Files;
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const title = history ? t.historyTitle : t.archiveTitle;
  const description = history ? t.historyDesc : t.archiveDesc;
  const emptyTitle = history
    ? (ar ? 'لا توجد روايات منشورة حاليًا' : 'No accounts have been published yet')
    : (ar ? 'لا توجد وثائق عامة حاليًا' : 'No public documents are available yet');
  const policy = history
    ? (ar ? 'تُراجع الرواية مع مصادرها قبل النشر، ويُذكر مصدرها وتاريخها عندما تكون هذه المعلومات متاحة.' : 'Each account is reviewed alongside its sources before publication. Attribution and dates are included where available.')
    : (ar ? 'تظهر الوثائق التي اكتملت مراجعتها وأُجيز عرضها للعامة. تبقى الوثائق الشخصية ضمن صلاحيات أصحابها والمخولين.' : 'Reviewed documents appear here once approved for public release. Personal documents are limited to their owners and authorized users.');

  return <main id="main-content" className="container inner-page">
    <div className="inner-eyebrow"><Icon size={19} aria-hidden="true" />{t.sections}</div>
    <h1>{title}</h1>
    <p className="inner-lead">{description}</p>
    <section className="coming-card" aria-labelledby="records-title">
      <span className="card-icon"><Icon size={24} aria-hidden="true" /></span>
      <h2 id="records-title">{emptyTitle}</h2>
      <p>{policy}</p>
      <Link className="text-link" href={`/${locale}/`}>{t.returnHome}<Arrow size={17} aria-hidden="true" /></Link>
    </section>
    <div className="directory-shell directory-policy"><ShieldCheck size={20} aria-hidden="true" />{t.privacy}</div>
  </main>;
}
