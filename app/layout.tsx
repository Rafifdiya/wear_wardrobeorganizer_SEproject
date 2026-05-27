import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { WearProvider } from '@/lib/store'
import { cn } from '@/lib/utils'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'WEAR — Smart Wardrobe',
  description: 'AI-powered wardrobe organizer and outfit generator',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn('h-full antialiased', playfair.variable, dmSans.variable)}>
      <body className="min-h-full flex flex-col font-sans" style={{ background: 'var(--cream)', color: 'var(--ink)' }}>
        <WearProvider>
          {children}
        </WearProvider>
      </body>
    </html>
  )
}
