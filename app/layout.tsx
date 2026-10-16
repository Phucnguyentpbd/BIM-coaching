import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'BIM Tuyến · Sổ tay thực hành 2027',
  description: 'Từ corridor Civil 3D đến phối hợp BIM, diễn họa InfraWorks và bản đồ GIS.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="vi"><body>{children}</body></html>;
}
