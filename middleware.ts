import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token

    // Handle missing or invalid token
    if (!token) {
      const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
      const isPublicPage = req.nextUrl.pathname === '/'

      if (!isAuthPage && !isPublicPage) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        
        // Public routes
        if (
          pathname.startsWith('/_next') ||
          pathname.startsWith('/api/auth') ||
          pathname === '/' ||
          pathname.startsWith('/auth')
        ) {
          return true
        }
        
        // Protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth routes (NextAuth.js)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
  ],
} 