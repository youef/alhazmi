import Link from 'next/link';
import { ArrowUpLeft, ShieldCheck, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectionCards } from '@/components/section-cards';
import { getDictionary, isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: t.brand, description: t.heroBody };
}
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return <main>
    <section className="hero">
      <div className="hero-pattern" aria-hidden="true"/>
      <div className="container hero-content">
        <div className="hero-overline"><Sparkles size={16}/><span>{t.heroKicker}</span></div>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroBody}</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href={`/${locale}/branches`}>{t.browse}<ArrowUpLeft size={18}/></Link>
          <Link className="btn btn-outline" href={`/${locale}/lineage`}>{t.exploreLineage}</Link>
        </div>
        <div className="hero-note"><ShieldCheck size={17}/><span>{t.editorial}</span></div>
      </div>
      <div className="hero-emblem" aria-hidden="true"><span>ح</span><small>الديوان</small></div>
    </section>
    <section className="intro-section container">
      <div className="intro-mark" aria-hidden="true">✦</div>
      <div><span className="section-eyebrow">{t.eyebrow}</span><h2>{t.welcome}</h2><p>{t.welcomeBody}</p></div>
    </section>
    <section className="sections-area"><div className="container">
      <div className="section-heading"><div><span className="section-eyebrow">{t.brand}</span><h2>{t.sections}</h2></div><div className="section-line" aria-hidden="true"/></div>
      <SectionCards locale={locale}/>
    </div></section>
    <section className="container principles"><ShieldCheck size={23}/><p>{t.privacy}</p></section>
  </main>;
}
