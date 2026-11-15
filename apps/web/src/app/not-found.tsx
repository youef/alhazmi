import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { PortalShell } from '@/components/portal-shell';

export default function NotFound() {
  return <PortalShell locale="ar">
    <main id="main-content" className="container inner-page">
      <div className="inner-eyebrow"><AlertCircle size={19} aria-hidden="true" />404</div>
      <h1>الصفحة غير موجودة</h1>
      <p className="inner-lead">قد يكون الرابط قديمًا. يمكنك العودة للرئيسية واختيار القسم المطلوب.</p>
      <Link className="text-link" href="/">العودة للرئيسية</Link>
    </main>
  </PortalShell>;
}
