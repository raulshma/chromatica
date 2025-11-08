import type { ReactNode } from 'react';
import './globals.css';
import '@/lib/error-handler';

export const metadata = {
  title: 'Chromatica Admin',
  description: 'Admin panel for managing Chromatica wallpapers and categories.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
