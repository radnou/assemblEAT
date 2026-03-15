import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { InstallBanner } from '@/components/InstallBanner';
import { Toaster } from '@/components/ui/sonner';
import { HydrationProvider } from '@/components/HydrationProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AssemblEat — Repas sans décision',
  description: 'Simplifiez votre semaine alimentaire avec la méthode CPB et le suivi Nutri-Score',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AssemblEat',
  },
};

export const viewport: Viewport = {
  themeColor: '#2E4057',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-[var(--color-surface)] text-[var(--color-text-main)] font-sans antialiased">
        <HydrationProvider>
          <main className="pb-20 min-h-screen max-w-5xl mx-auto px-4">
            {children}
          </main>
          <BottomNav />
          <InstallBanner />
          <Toaster position="top-center" />
        </HydrationProvider>
      </body>
    </html>
  );
}
