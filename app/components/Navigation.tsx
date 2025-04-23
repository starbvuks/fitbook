'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Plus, Menu, X, Home, ShoppingBag, Shirt, Search, Compass, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Navigation() {
  const { data: session, status } = useSession()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
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

  // Handle click outside for MOBILE menu
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

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

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
              className="text-xl flex items-center font-bold bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent"
            >
                <Image src="/logo3.png" alt="Fitbook Logo" className="invert" width={32} height={32} />
                Fitbook
            </Link>

            {session && (
              <div className="hidden md:flex items-center space-x-8">
                <NavLink href="/catalog"><span className="hover:text-accent-purple transition-colors">Catalog</span></NavLink>
                <NavLink href="/outfits"><span className="hover:text-accent-purple transition-colors">Outfits</span></NavLink>
                <NavLink href="/lookbooks" disabled><span>Lookbooks</span></NavLink>
                <NavLink href="/discover"><span className="hover:text-accent-purple transition-colors">Discover</span></NavLink>
              </div>
            )}
          </div>

          {session ? (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block">
                <DropdownMenu >
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-[1000] mt-1" align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/catalog/add">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Add Item
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/outfits/create">
                        <Shirt className="w-4 h-4 mr-2" />
                        Create Outfit
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        fill
                        sizes="32px"
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-accent-purple flex items-center justify-center text-white text-sm font-medium">
                        {session.user?.name?.[0].toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="sr-only">Open user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 z-[1000] mt-1" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">
                        {session.user?.name || 'User Name'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center gap-2 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <div className="flex md:hidden">
                <button
                  ref={mobileMenuButtonRef}
                  type="button"
                  className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMobileMenu(!showMobileMenu)
                  }}
                  aria-expanded={showMobileMenu}
                  aria-controls="mobile-menu"
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
                    e.stopPropagation()
                    setShowMobileMenu(!showMobileMenu)
                  }}
                  aria-expanded={showMobileMenu}
                  aria-controls="mobile-menu"
                >
                  <span className="sr-only">Open main menu</span>
                  {showMobileMenu ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => signIn('google')}>
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ease-in-out ${
          showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowMobileMenu(false)}
        aria-hidden={!showMobileMenu}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <div
          className={`fixed inset-y-0 right-0 z-50 w-72 bg-card shadow-xl transition-transform duration-300 ease-in-out transform ${
            showMobileMenu ? 'translate-x-0' : 'translate-x-full'
          }`}
          ref={mobileMenuRef}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
               <span className="font-semibold">Menu</span>
               <Button variant="ghost" size="icon" onClick={() => setShowMobileMenu(false)}>
                   <X className="h-5 w-5" />
                   <span className="sr-only">Close menu</span>
               </Button>
            </div>

            <div className="flex-grow overflow-y-auto p-3 space-y-1">
               {session ? (
                   <>
                       <MobileNavLink href="/catalog" icon={<ShoppingBag className="w-5 h-5" />} onClick={() => setShowMobileMenu(false)}>My Catalog</MobileNavLink>
                       <MobileNavLink href="/outfits" icon={<Shirt className="w-5 h-5" />} onClick={() => setShowMobileMenu(false)}>My Outfits</MobileNavLink>
                       <MobileNavLink href="/discover" icon={<Compass className="w-5 h-5" />} onClick={() => setShowMobileMenu(false)}>Discover</MobileNavLink>
                       <MobileNavLink href="/lookbooks" icon={<Compass className="w-5 h-5" />} disabled onClick={() => setShowMobileMenu(false)}>Lookbooks</MobileNavLink>
                       <MobileNavLink href="/outfits/create" icon={<Plus className="w-5 h-5" />} onClick={() => setShowMobileMenu(false)}>Create Outfit</MobileNavLink>
                       <MobileNavLink href="/catalog/add" icon={<Plus className="w-5 h-5" />} onClick={() => setShowMobileMenu(false)}>Add Item</MobileNavLink>
                   </>
               ) : (
                   <MobileNavLink href="/" icon={<Home className="w-5 h-5" />} onClick={() => setShowMobileMenu(false)}>Home</MobileNavLink>
               )}
            </div>

            <div className="border-t border-border p-3">
               {session ? (
                   <div className="space-y-2">
                       <MobileNavLink href="/profile" icon={<User className="w-5 h-5" />} onClick={() => setShowMobileMenu(false)}>Profile Settings</MobileNavLink>
                       <Button
                         variant="ghost"
                         className="w-full justify-start gap-3 text-foreground-soft hover:text-destructive hover:bg-destructive/10"
                         onClick={() => {
                           setShowMobileMenu(false)
                           signOut({ callbackUrl: '/' })
                         }}
                       >
                           <LogOut className="w-5 h-5" />
                           <span className="text-[15px]">Sign Out</span>
                       </Button>
                   </div>
                 ) : (
                   <Button
                     variant="ghost"
                     className="w-full justify-start gap-3 text-foreground-soft hover:text-foreground hover:bg-accent"
                     onClick={() => {
                       setShowMobileMenu(false)
                       signIn('google')
                     }}
                   >
                     <span className="text-[15px]">Sign In with Google</span>
                   </Button>
                 )}
            </div>
          </div>
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
      <div className="relative mb-0.5">
        <span
          className="text-sm font-medium text-neutral-600 cursor-not-allowed"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {children}
        </span>
        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-popover border border-border rounded-md shadow-lg whitespace-nowrap z-50 text-sm text-popover-foreground animate-in fade-in slide-in-from-top-1">
             Coming Soon! 🎉
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="text-sm font-medium text-foreground-soft hover:text-foreground transition-colors"
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
      <div className="flex items-center gap-3 px-4 py-2.5 text-foreground-soft/50 cursor-not-allowed rounded-lg">
        {icon}
        <span className="text-[15px]">{children}</span>
        <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded">Soon</span>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 text-foreground-soft hover:text-foreground hover:bg-accent rounded-lg transition-colors"
      onClick={onClick}
    >
      {icon}
      <span className="text-[15px]">{children}</span>
    </Link>
  )
} 