import type { Metadata } from 'next';
import { Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SWRProvider } from '@/lib/swr-provider';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EquiTeams',
  description: 'A place for teams to work together',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${plusJakartaSans.variable} ${geistMono.variable} antialiased`}
      >
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
