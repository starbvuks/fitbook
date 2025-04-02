import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Sora, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navigation from './components/Navigation'
import { Toaster } from "@/components/ui/toaster"

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
  description: 'Create, organize, and share your outfits with style',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${sora.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <Providers>
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
