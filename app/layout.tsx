import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Sora, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navigation from './components/Navigation'
import { Toaster } from "@/components/ui/toaster"
import TopProgressBar from '@/app/components/TopProgressBar'
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from 'react'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Fitbook - Your Digital Wardrobe',
  description: 'Create, organize, and finance your drip',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${sora.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-foreground font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <Analytics />
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          <Navigation />
          <main>
            {children}
          </main>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
