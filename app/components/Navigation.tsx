'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Plus, Menu, X, Home, ShoppingBag, Shirt, Book, Compass, User, LogOut } from 'lucide-react'

export default function Navigation() {
  const { data: session, status } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)

  // Handle session initialization
  useEffect(() => {
    setMounted(true)
    if (status !== 'loading') {
      setSessionChecked(true)
      
      // Log session state for debugging
      console.log('Session state:', {
        status,
        sessionExists: !!session,
        userEmail: session?.user?.email || 'none'
      })
    }
  }, [session, status])

  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileMenu])

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setShowMobileMenu(false)
      if (status === 'unauthenticated' && document.cookie.includes('next-auth.session-token')) {
        // Cookie exists but session not recognized - could be a sync issue
        window.location.reload()
      }
    }

    // Add event listeners
    window.addEventListener('popstate', handleRouteChange)
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [status])

  // Add body lock when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showMobileMenu])

  // Don't show anything until mounted
  if (!mounted) return null

  // Show loading state
  if (status === 'loading') {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link 
                href="/" 
                className="text-xl flex items-center gap-1 font-bold bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent"
              >
                Fitbook
              </Link>
            </div>
            <div className="h-10 w-24 animate-pulse rounded-lg bg-background-soft" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link 
              href="/" 
              className="text-xl flex items-center gap-1 font-bold bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent"
            >
                {/* <Image src="/logo.png" alt="Fitbook Logo" width={32} height={32} /> */}
                Fitbook
            </Link>

            {session && (
              <div className="hidden md:flex items-center space-x-8">
                <NavLink href="/catalog"><span className="hover:text-accent-purple transition-colors">Catalog</span></NavLink>
                <NavLink href="/outfits"><span className="hover:text-accent-purple transition-colors">Outfits</span></NavLink>
                <NavLink href="/lookbooks" disabled>Lookbooks</NavLink>
                <NavLink href="/discover" disabled>Discover</NavLink>
              </div>
            )}
          </div>

          {session ? (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block">
                <Link
                  href="/catalog/add"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4 " />
                  <span>Add Item</span>
                </Link>
              </div>

              <div className="hidden sm:block">
                <Link
                  href="/outfits/create"
                  className="px-4 py-2 rounded-lg border-2 border-border-bright hover:bg-accent-purple/20 transition-colors"
                >
                  Create Outfit
                </Link>
              </div>

              <div className="relative" ref={menuRef}>
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
                  <div className="absolute right-0 mt-4 w-48 bg-background border border-border rounded-lg shadow-lg my-1">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="font-medium">{session.user?.name}</p>
                      <p className="text-sm text-foreground-soft truncate">
                        {session.user?.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-foreground-soft hover:text-foreground hover:bg-accent-purple/10"
                    >
                      <User className="w-4 h-4" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-foreground-soft hover:text-foreground hover:bg-accent-purple/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="flex md:hidden">
                <button
                  ref={mobileMenuButtonRef}
                  type="button"
                  className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMobileMenu(!showMobileMenu);
                  }}
                  aria-expanded={showMobileMenu}
                >
                  <span className="sr-only">Open main menu</span>
                  {showMobileMenu ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button for Not Signed In State */}
              <div className="flex md:hidden">
                <button
                  ref={mobileMenuButtonRef}
                  type="button"
                  className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMobileMenu(!showMobileMenu);
                  }}
                  aria-expanded={showMobileMenu}
                >
                  <span className="sr-only">Open main menu</span>
                  {showMobileMenu ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
              
              <button
                onClick={() => signIn('google')}
                className="px-4 py-2 rounded-lg border border-border-bright hover:bg-background-soft transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm rounded-xl md:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="fixed inset-y-0  right-0 z-50 w-72 shadow-xl rounded-xl"
            ref={mobileMenuRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full pt-16 ">
              <div className="space-y-1 px-3 bg-zinc-900 py-3 rounded-xl">
                <Link 
                  href="/catalog" 
                  className="flex items-center gap-3 px-4 py-3.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-[15px]">My Catalog</span>
                </Link>
                <Link 
                  href="/outfits"
                  className="flex items-center gap-3 px-4 py-3.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Shirt className="w-5 h-5" />
                  <span className="text-[15px]">My Outfits</span>
                </Link>
                <Link 
                  href="/outfits/create"
                  className="flex items-center gap-3 px-4 py-3.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[15px]">Create Outfit</span>
                </Link>
                <Link 
                  href="/catalog/add"
                  className="flex items-center gap-3 px-4 py-3.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[15px]">Add Item</span>
                </Link>
              </div>

              {/* <div className="mt-auto border-t rounded-b-xl border-zinc-800 bg-zinc-900">
                {session ? (
                  <div className="p-3">
                    <div className="px-4 py-3 mb-1">
                      <p className="text-[15px] font-medium text-white">{session.user?.name}</p>
                      <p className="text-sm text-zinc-400 truncate">
                        {session.user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        signOut();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-[15px]">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3">
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        signIn('google');
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <span className="text-[15px]">Sign In with Google</span>
                    </button>
                  </div>
                )}
              </div> */}
            </div>
          </div>
        </div>
      )}
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
          className="text-foreground-soft/50 cursor-not-allowed text-neutral-600"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {children}
        </button>
        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 ml-2 px-3 py-1.5 bg-background border border-border rounded-lg shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-1">
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

function MobileNavLink({ 
  href, 
  children, 
  icon, 
  disabled = false,
  onClick
}: { 
  href: string
  children: React.ReactNode
  icon: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 text-foreground-soft/50 cursor-not-allowed rounded-lg">
        {icon}
        <span>{children}</span>
        <span className="ml-auto text-xs bg-background-soft px-2 py-0.5 rounded">Soon</span>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-foreground-soft hover:text-foreground hover:bg-accent-purple/10 rounded-lg transition-colors"
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
} 