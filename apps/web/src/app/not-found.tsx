import Link from 'next/link';
export default function NotFound() {
  return <main style={{ minHeight: '80vh', display: 'grid', placeContent: 'center', textAlign: 'center', padding: 24 }}>
    <h1>404</h1><p>الصفحة غير موجودة — Page not found</p><Link href="/ar">العودة للرئيسية</Link>
  </main>;
}
