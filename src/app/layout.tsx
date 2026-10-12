import type { Metadata } from 'next';
import {
  Chakra_Petch,
  JetBrains_Mono,
  Manrope,
  Space_Grotesk,
} from 'next/font/google';
import './globals.css';
import './cyber.css';
import { Fx } from './fx';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});
const chakra = Chakra_Petch({
  variable: '--font-chakra',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'José David Ismael Barrera Bernal | Senior QA Engineer',
  description:
    'José David Barrera Bernal is a Senior QA Engineer specializing in API testing, test automation, accessibility, performance, and quality engineering.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} ${chakra.variable} ${jetbrains.variable}`}
    >
      <body>
        {children}
        <Fx />
      </body>
    </html>
  );
}
