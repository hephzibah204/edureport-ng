import './globals.css';
import { GraduationCap } from 'lucide-react';
import { Toaster } from 'sonner';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://reportsheet.com.ng'),
  title: {
    default: 'reportsheet.com.ng - Modern School Management',
    template: '%s | reportsheet.com.ng',
  },
  description: 'The all-in-one platform for schools, teachers, and parents to engineer academic excellence through data.',
  keywords: ['school management', 'education', 'reportsheet', 'academic intelligence', 'student outcomes'],
  openGraph: {
    title: 'reportsheet.com.ng - Modern School Management',
    description: 'The premier digital operating system for high-performance schools.',
    url: 'https://reportsheet.com.ng',
    siteName: 'reportsheet.com.ng',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'reportsheet.com.ng - Modern School Management',
    description: 'The premier digital operating system for high-performance schools.',
  },
  appleWebApp: {
    capable: true,
    title: 'ReportSheet',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/next.svg" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
