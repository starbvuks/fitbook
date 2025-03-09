import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Sora, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navigation from './components/Navigation'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
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
    <html lang="en" className={`${jakarta.variable} ${sora.variable} ${jetbrains.variable} dark`} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <Providers>
          <Navigation />
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
