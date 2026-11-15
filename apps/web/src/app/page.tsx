import Link from 'next/link';

export default function IndexPage() {
  return <main lang="ar" dir="rtl" style={{minHeight:'100vh',background:'#092b25',color:'#fff',display:'grid',placeContent:'center',textAlign:'center',padding:'2rem',fontFamily:'Tahoma,Arial,sans-serif'}}>
    <h1 style={{fontSize:'2.5rem',marginBottom:12}}>ديوان الحازمي</h1>
    <p>منصة تراثية لحفظ التاريخ والموروث وتوثيق الأنساب</p>
    <Link href="/ar" style={{display:'inline-block',marginTop:20,padding:'12px 24px',borderRadius:8,background:'#caa86a',color:'#16392d',fontWeight:700}}>دخول الموقع</Link>
  </main>;
}
