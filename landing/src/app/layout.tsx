import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PostHogProvider from '@/components/PostHogProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SilverKey — Agent Intelligence Platform',
  description:
    'SilverKey helps brokerages transform SkySlope transaction data into coaching, support, and growth opportunities — so every agent performs at their best.',
  icons: { icon: '/assets/minilogo.png' },
  openGraph: {
    title: 'SilverKey — Agent Intelligence Platform',
    description: 'Turn transaction data into agent growth.',
    url: 'https://usesilverkey.com',
    siteName: 'SilverKey',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
