'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

export default function Navigation() {
  const { data: session, status } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't show anything until the session is checked
  if (!mounted) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="px-container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-xl font-bold bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent"
            >
              Fitbook
            </Link>

            {session && (
              <div className="hidden md:flex items-center space-x-8">
                <NavLink href="/catalog">Catalog</NavLink>
                <NavLink href="/outfits">Outfits</NavLink>
                <NavLink href="/lookbooks" disabled>Lookbooks</NavLink>
                <NavLink href="/discover" disabled>Discover</NavLink>
              </div>
            )}
          </div>

          {status === "loading" ? (
            <div className="h-10 w-24 animate-pulse rounded-lg bg-background-soft" />
          ) : session ? (
            <div className="flex items-center space-x-4">
              <Link
                href="/catalog/add"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-accent-purple text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </Link>

              <Link
                href="/outfits/create"
                className="px-4 py-2 rounded-lg border border-border-bright hover:bg-background-soft transition-colors"
              >
                Create Outfit
              </Link>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center text-white">
                      {session.user?.name?.[0] || 'U'}
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-1">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="font-medium">{session.user?.name}</p>
                      <p className="text-sm text-foreground-soft truncate">
                        {session.user?.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-foreground-soft hover:text-foreground hover:bg-background-soft"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-4 py-2 text-foreground-soft hover:text-foreground hover:bg-background-soft"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="px-4 py-2 rounded-lg border border-border-bright hover:bg-background-soft transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, children, disabled = false }: { 
  href: string
  children: React.ReactNode
  disabled?: boolean
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (disabled) {
    return (
      <div className="relative">
        <button
          className="text-foreground-soft/50 cursor-not-allowed"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {children}
        </button>
        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-background border border-border rounded-lg shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-1">
            <p className="text-sm">Coming Soon! 🎉</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="text-foreground-soft hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  )
} 