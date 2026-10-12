import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'José David Ismael Barrera Bernal | Senior QA Engineer',
  description:
    'José David Barrera Bernal is a Senior QA Engineer specializing in API testing, test automation, accessibility, performance, and quality engineering.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
