import type { ReactNode } from 'react';
import '@fontsource-variable/noto-sans-arabic';
import '@fontsource-variable/figtree';
import './globals.css';

const restoreTheme = `try{const t=localStorage.getItem('diwan-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch{}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ar" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: restoreTheme }} /></head>
    <body>{children}</body>
  </html>;
}
