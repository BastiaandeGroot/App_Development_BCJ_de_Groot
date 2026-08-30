import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Product Data Readiness Scan',
  description: 'Controleer of productdata volledig en machineleesbaar genoeg is voor agentic commerce.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="flex min-h-screen flex-col font-sans text-ink">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-subtle sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-brand text-[10px] font-bold text-white">R</span>
              <span>Readiness Scan — productdata voor agentic commerce</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/wat-we-controleren" className="transition hover:text-ink">Wat we controleren</Link>
              <span>De analyse draait in je browser · geen data geüpload</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
