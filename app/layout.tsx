import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BIM Coaching — Giáo trình Thực hành BIM Tuyến 2027',
  description: 'Hệ thống huấn luyện & thực hành chuyên sâu BIM Tuyến: Civil 3D, Navisworks, InfraWorks, QGIS và 4D/5D.',
  manifest: '/manifest.json',
  icons: { icon: '/bim-coaching.png' },
};

export const viewport: Viewport = {
  themeColor: '#131822',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-[#0c1017] text-slate-200 antialiased overflow-hidden">{children}</body>
    </html>
  );
}
