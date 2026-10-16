import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BIM Notebook — Sổ tay Kỹ thuật Thực hành BIM Tuyến 2027',
  description: 'Sổ tay thực hành kỹ thuật chuyên sâu: Civil 3D, Navisworks, InfraWorks, QGIS và BIM Tuyến 4D/5D.',
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
