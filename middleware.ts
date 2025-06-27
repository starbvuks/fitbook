import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token

    // Handle missing or invalid token
    if (!token) {
      const isPublic = 
        req.nextUrl.pathname === '/' ||
        req.nextUrl.pathname.startsWith('/auth') ||
        req.nextUrl.pathname.startsWith('/instructions') || // Allow instructions page
        /\/outfits\/[^/]+$/.test(req.nextUrl.pathname); // Allow specific outfit pages
        
      if (!isPublic) {
        // Construct the sign-in URL with the callbackUrl
        const signInUrl = new URL('/auth/signin', req.url);
        signInUrl.searchParams.set('callbackUrl', req.url);
        return NextResponse.redirect(signInUrl);
      }
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        
        // Regex to match /outfits/[id] where [id] is not 'create'
        // Allows /outfits/some-id but not /outfits/create or /outfits/
        const isPublicOutfitPage = /^\/outfits\/(?!create\/?$)[^/]+$/.test(pathname)

        // Public routes that are always allowed
        if (
          pathname.startsWith('/_next') ||           // Next.js internals
          pathname.startsWith('/api/auth') ||        // NextAuth API routes
          pathname.startsWith('/public') ||          // Files in /public
          pathname.startsWith('/images') ||          // Image files
          pathname.startsWith('/logo') ||            // Logo files
          pathname.startsWith('/instructions') ||   // Instructions page
          pathname === '/' ||                      // Landing page
          pathname.startsWith('/auth') ||           // Auth pages (signin, signout, etc.)
          isPublicOutfitPage                     // Public outfit detail pages
        ) {
          return true
        }
        
        // For any other route, a token is required
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
     * - images folder
     * - logo files
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth|images|logo).*)",
  ],
} 