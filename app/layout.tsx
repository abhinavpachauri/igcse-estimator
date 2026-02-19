import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { BackgroundAura } from '@/components/ui/BackgroundAura'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
})

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Threshold — IGCSE Grade Estimator',
  description:
    'Estimate your Cambridge IGCSE grades based on five years of historical grade boundary data from the February/March series.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="antialiased">
        <BackgroundAura />
        {children}
      </body>
    </html>
  )
}
