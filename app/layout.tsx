import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Product Data Readiness Scan',
  description: 'Controleer of productdata volledig en machineleesbaar genoeg is voor agentic commerce.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="font-sans">{children}</body>
    </html>
  );
}
