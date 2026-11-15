import type { Metadata } from 'next';
import { PortalHome } from '@/components/portal-home';
import { PortalShell } from '@/components/portal-shell';

export const metadata: Metadata = {
  title: 'ديوان الحازمي',
  description: 'بوابة ديوان الحازمي للأفخاذ والعوائل والأنساب والموروث العائلي.',
};

export default function IndexPage() {
  return <PortalShell locale="ar"><PortalHome locale="ar" /></PortalShell>;
}
