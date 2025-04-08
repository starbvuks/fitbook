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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      
      // Don't close mobile menu when clicking on the mobile menu itself or the toggle button
      const targetElement = event.target as HTMLElement;
      const isToggleButton = targetElement.closest('[data-mobile-toggle]') !== null;
      const isInsideMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(targetElement);
      
      if (!isToggleButton && !isInsideMobileMenu && showMobileMenu) {
        setShowMobileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuRef, mobileMenuRef, showMobileMenu])

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
                <Image src="/logo.png" alt="Fitbook Logo" width={32} height={32} />
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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link 
              href="/" 
              className="text-xl flex items-center gap-1 font-bold bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent"
            >
                <Image src="/logo.png" alt="Fitbook Logo" width={32} height={32} />
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
              <button 
                data-mobile-toggle
                className="md:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileMenu(!showMobileMenu);
                }}
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button for Not Signed In State */}
              <button 
                data-mobile-toggle
                className="md:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileMenu(!showMobileMenu);
                }}
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
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
          ref={mobileMenuRef}
          className="fixed inset-0 z-50 top-16 bg-background border-t border-border overflow-y-auto pb-safe-area-inset-bottom"
        >
          <div className="px-4 py-6 space-y-6">
            {session ? (
              <>
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="/catalog/add"
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-accent-purple/10 hover:bg-accent-purple/20 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Plus className="w-6 h-6 text-accent-purple" />
                    <span className="text-sm font-medium">Add Item</span>
                  </Link>
                  <Link
                    href="/outfits/create"
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-accent-purple/10 hover:bg-accent-purple/20 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Shirt className="w-6 h-6 text-accent-purple" />
                    <span className="text-sm font-medium">Create Outfit</span>
                  </Link>
                </div>

                {/* Navigation Links */}
                <div className="space-y-1">
                  <MobileNavLink href="/" icon={<Home />} onClick={() => setShowMobileMenu(false)}>
                    Home
                  </MobileNavLink>
                  <MobileNavLink href="/catalog" icon={<ShoppingBag />} onClick={() => setShowMobileMenu(false)}>
                    My Catalog
                  </MobileNavLink>
                  <MobileNavLink href="/outfits" icon={<Shirt />} onClick={() => setShowMobileMenu(false)}>
                    My Outfits
                  </MobileNavLink>
                  <MobileNavLink href="/lookbooks" icon={<Book />} disabled>
                    Lookbooks
                  </MobileNavLink>
                  <MobileNavLink href="/discover" icon={<Compass />} disabled>
                    Discover
                  </MobileNavLink>
                </div>

                {/* User Section */}
                <div className="pt-6 border-t border-border">
                  <div className="flex items-center gap-3 mb-4">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center text-white">
                        {session.user?.name?.[0] || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{session.user?.name}</p>
                      <p className="text-sm text-foreground-soft truncate max-w-[200px]">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <MobileNavLink href="/profile" icon={<User />} onClick={() => setShowMobileMenu(false)}>
                      Profile Settings
                    </MobileNavLink>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="flex items-center w-full gap-3 px-4 py-3 text-left text-foreground-soft hover:text-foreground hover:bg-accent-purple/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 h-[calc(100vh-16rem)]">
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">Welcome to Fitbook</h2>
                  <p className="text-foreground-soft">Sign in to manage your wardrobe</p>
                </div>
                <button
                  onClick={() => {
                    setShowMobileMenu(false)
                    signIn('google')
                  }}
                  className="px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors"
                >
                  Sign in with Google
                </button>
              </div>
            )}
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