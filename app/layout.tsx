import './globals.css'
import type { Metadata, Viewport } from 'next'
import { I18nProvider } from '@/lib/i18n'
import { Inter } from 'next/font/google'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Work Hours & Invoices',
  description: 'Track hours, upload proofs & invoices. Cloud + PWA.',
}

export const viewport: Viewport = { themeColor: '#0f172a' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const dark = stored ? stored === 'dark' : prefersDark;
                document.documentElement.classList.toggle('dark', dark);
              } catch {}
            `,
          }}
        />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
