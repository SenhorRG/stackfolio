import type { Metadata } from 'next';
import { AppNav } from '@/components/layout/app-nav';
import { Providers } from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stackfolio',
  description: 'Stack organizer and ATS-safe resume PDFs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppNav />
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
