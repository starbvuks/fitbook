'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const floatingImages = [
  '/images/sample1.jpeg',
  '/images/sample2.jpeg',
  '/images/sample3.png',
  '/images/sample4.png',
  '/images/sample5.png',
  '/images/sample6.png',
]

const noiseSvg =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><filter id="n" x="0" y="0"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.12"/></svg>'

// More organic/randomized image configs
const imageConfigs = [
  { top: '7%', left: '8%', size: 90, sizeMobile: 60, z: 10, blur: false, rotate: -12, floatY: 18, floatX: 6, border: true, dur: 8.5, delay: 0.2 },
  { top: '15%', left: '75%', size: 110, sizeMobile: 70, z: 12, blur: false, rotate: 13, floatY: 22, floatX: -8, border: true, dur: 9.2, delay: 0.7 },
  { top: '50%', left: '3%', size: 80, sizeMobile: 54, z: 8, blur: true, rotate: -7, floatY: 14, floatX: 10, border: false, dur: 7.7, delay: 1.1 },
  { top: '60%', left: '85%', size: 85, sizeMobile: 56, z: 8, blur: true, rotate: 8, floatY: 13, floatX: -12, border: false, dur: 8.9, delay: 1.5 },
  { top: '80%', left: '20%', size: 100, sizeMobile: 65, z: 11, blur: false, rotate: 7, floatY: 16, floatX: 7, border: true, dur: 9.7, delay: 0.5 },
  { top: '85%', left: '68%', size: 90, sizeMobile: 60, z: 10, blur: false, rotate: -10, floatY: 17, floatX: -9, border: true, dur: 8.2, delay: 1.3 },
]

export default function LandingPage() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      {/* Radial gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial from-[#18122B] via-[#1E1B2E] to-[#0F0C1A] opacity-90" />
        <img
          src={noiseSvg}
          alt="noise"
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-soft-light"
          draggable={false}
        />
      </div>

      {/* Top Nav */}
      <nav className="w-full flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 z-20 fixed top-0 left-0 bg-black/40 backdrop-blur-md border-b border-border/30" style={{ WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-accent-purple drop-shadow-lg">Fitbook</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/catalog" className="nav-link text-sm sm:text-base">Catalog</Link>
          <Link href="/outfits" className="nav-link text-sm sm:text-base">Outfits</Link>
          <Link href="/lookbooks" className="nav-link text-sm sm:text-base">Lookbooks</Link>
          <Link href="/discover" className="nav-link text-sm sm:text-base">Discover</Link>
          <Link href="/login" className="btn btn-ghost px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base">Log In</Link>
          <Link href="/signup" className="btn btn-primary px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base font-semibold">Sign Up</Link>
          <button
            aria-label="Toggle theme"
            className="ml-2 p-2 rounded-full bg-muted/70 hover:bg-accent transition-colors shadow-md"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Floating Images - More organic, mobile-aware */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {floatingImages.map((src, i) => {
          const cfg = imageConfigs[i]
          return (
            <motion.img
              key={src}
              src={src}
              alt=""
              className={cn(
                'absolute rounded-2xl shadow-xl object-cover',
                cfg.blur ? 'blur-md opacity-60' : 'opacity-95',
                cfg.border ? 'border-4 border-white/80' : ''
              )}
              style={{
                width: isMobile ? cfg.sizeMobile : cfg.size,
                height: isMobile ? cfg.sizeMobile : cfg.size,
                top: cfg.top,
                left: cfg.left,
                zIndex: cfg.z,
                rotate: `${cfg.rotate}deg`,
              }}
              initial={{ y: 0, x: 0, opacity: 0 }}
              animate={{
                y: [0, cfg.floatY, 0],
                x: [0, cfg.floatX, 0],
                opacity: [0, 1, 0.95, 1],
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: cfg.dur,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
                delay: cfg.delay,
              }}
            />
          )
        })}
      </div>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center relative z-20 px-2 sm:px-4 pt-28">
        {/* Animated Glow */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: [0.7, 0.9, 0.7], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror' }}
          style={{
            width: isMobile ? '220px' : '420px',
            height: isMobile ? '110px' : '220px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(155,119,255,0.25) 0%, rgba(24,18,43,0.0) 80%)',
            filter: 'blur(24px)',
          }}
        />
        <h1 className="font-display text-4xl sm:text-6xl md:text-8xl font-extrabold mb-4 sm:mb-6 tracking-tight text-gray-300 drop-shadow-xl relative z-10" style={{ letterSpacing: '-0.04em' }}>
          fitbook
        </h1>
        <p className="text-lg sm:text-2xl text-muted-foreground mb-7 sm:mb-10 max-w-md sm:max-w-2xl mx-auto font-sans relative z-10">
          Your personal outfit planner. Create, discover, and share looks with style, ease, and inspiration.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center relative z-10 w-full max-w-xs sm:max-w-none mx-auto">
          {session ? (
            <>
              <motion.div
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/catalog"
                  className="btn btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  Go to Catalog
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/instructions"
                  className="btn btn-secondary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  How to Use
                </Link>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/auth/signin"
                  className="btn btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  Log In
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/instructions"
                  className="btn btn-secondary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  How to Use
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </main>

      {/* Scroll to explore indicator */}
      {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
        <span className="text-muted-foreground text-base mb-1">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-9 h-9 rounded-full border-2 border-accent-purple flex items-center justify-center bg-background/80 shadow-md"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div> */}

      {/* Optional: Cookie banner */}
      {/* <div className="fixed bottom-0 left-0 w-full flex justify-center z-50">
        <div className="bg-card border border-border rounded-lg px-4 py-2 m-4 flex items-center gap-3 shadow-lg">
          <span className="text-sm text-muted-foreground">This website uses cookies.</span>
          <button className="btn btn-primary btn-sm">Accept</button>
        </div>
      </div> */}
    </div>
  )
}
