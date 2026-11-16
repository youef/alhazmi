import Link from 'next/link';
import { ArrowUpLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { SectionCards } from '@/components/section-cards';
import { getDictionary, type Locale } from '@/lib/i18n';

export function PortalHome({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const t = getDictionary(locale);
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;

  return <main id="main-content" className="portal-main">
    <div className="container">
      <section className="portal-banner" aria-labelledby="welcome-title">
        <div className="banner-content">
          <p className="banner-kicker">{ar ? 'إرثٌ يجمعنا… ومستقبلٌ نكتبه' : 'Online portal'}</p>
          <h1 id="welcome-title">{t.brand}</h1>
          <p>{t.welcomeBody}</p>
          <a className="primary-button" href="#services">{t.browse}<Arrow aria-hidden="true" size={17} /></a>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="banner-orbit orbit-outer"/>
          <div className="banner-orbit orbit-inner"/>
          <span className="banner-symbol banner-satellite satellite-book">📖</span>
          <span className="banner-symbol banner-satellite satellite-file">📄</span>
        </div>
      </section>

      <section id="services" className="portal-services" aria-labelledby="services-title">
        <div className="section-heading">
          <h2 id="services-title">{ar ? 'خدمات الديوان' : 'Diwan services'}</h2>
          <p>{ar ? 'استكشف الأقسام الرئيسية للديوان: دليل الأفخاذ والعوائل، شجرة النسب المعتمدة، التاريخ والروايات، والأرشيف الوثائقي.' : 'Explore the diwan’s main sections: the family and branch directory, the approved genealogy tree, history and accounts, and the documentary archive.'}</p>
        </div>
        <SectionCards locale={locale} />
      </section>

      <section className="approval-steps" aria-labelledby="steps-title">
        <h2 id="steps-title">{t.stepsTitle}</h2>
        <ol>{t.steps.map((step, index) => <li key={step.title}><span className="step-number" aria-hidden="true">{index + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
      </section>

      <section className="heritage-strip" aria-label={ar ? 'هوية الديوان' : 'Our heritage'}>
        <div>
          <span className="heritage-label">{ar ? 'الأصالة والانتماء' : 'HERITAGE & BELONGING'}</span>
          <h2>{ar ? 'جذور راسخة، وروابط لا تنقطع' : 'Deep roots. Lasting connections.'}</h2>
          <p>{ar ? 'نحفظ موروثنا، ونجمع حكاياتنا، ونصل الأجيال بتاريخ عائلاتهم.' : 'Preserving our heritage and connecting generations through family stories.'}</p>
          <Link href={`/${locale}/history/`}>{ar ? 'اكتشف تاريخ الديوان' : 'Explore our heritage'}<Arrow size={18} /></Link>
        </div>
      </section>
      <aside className="privacy-panel">
        <span className="privacy-icon"><ShieldCheck aria-hidden="true" size={23} /></span>
        <div><h2>{ar ? 'الخصوصية والتوثيق' : 'Privacy and verification'}</h2><p>{t.privacy}</p></div>
        <Link href={`/${locale}/lineage/`}>{ar ? 'عرض السجلات المعتمدة' : 'View approved records'}<Arrow aria-hidden="true" size={16} /></Link>
      </aside>
    </div>
  </main>;
}
