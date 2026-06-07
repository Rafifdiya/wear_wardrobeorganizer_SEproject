import type { Metadata, Viewport } from 'next'
import {
  Playfair_Display, DM_Sans,
  Plus_Jakarta_Sans, Cormorant_Garamond, Space_Grotesk,
} from 'next/font/google'
import { WearProvider } from '@/lib/store'
import { ThemeProvider } from '@/lib/theme'
import { cn } from '@/lib/utils'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'WEAR — Smart Wardrobe',
  description: 'AI-powered wardrobe organizer and outfit generator',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        'h-full antialiased',
        playfair.variable,
        dmSans.variable,
        plusJakarta.variable,
        cormorant.variable,
        spaceGrotesk.variable,
      )}
    >
      {/* Prevent flash of unstyled content for theme */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var c = localStorage.getItem('wear-color');
            var f = localStorage.getItem('wear-font');
            var s = localStorage.getItem('wear-textsize');
            if (c) document.documentElement.setAttribute('data-theme', c);
            if (f) document.documentElement.setAttribute('data-font', f);
            if (s) document.documentElement.setAttribute('data-textsize', s);
          } catch(e) {}
        ` }} />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ background: 'var(--cream)', color: 'var(--fg)' }}
      >
        <ThemeProvider>
          <WearProvider>
            {children}
          </WearProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
