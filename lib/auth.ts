import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Define Account type locally instead of importing it
type Account = {
  provider: string;
  providerAccountId: string;
  type: string;
}

const prisma = new PrismaClient()

// Helper function to get the cookie domain
function getCookieDomain() {
  // In development, use undefined to keep cookies on localhost
  if (process.env.NODE_ENV !== 'production') return undefined;
  
  // In production, get domain from NEXTAUTH_URL or fallback
  const url = process.env.NEXTAUTH_URL;
  if (!url) return undefined;
  
  try {
    const domain = new URL(url).hostname;
    // If it's a custom domain, just use the domain itself
    // If it's a vercel deployment or similar, consider if you need a broader domain
    return domain.includes('localhost') ? undefined : domain;
  } catch (error) {
    console.error('Error parsing NEXTAUTH_URL:', error);
    return undefined;
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) {
        console.error("No email provided by OAuth provider")
        return false
      }

      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            accounts: true
          }
        })

        if (!existingUser) {
          // Create new user and link account
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || '',
              image: user.image,
              currency: "INR",
              accounts: {
                create: {
                  type: account?.type || 'oauth',
                  provider: account?.provider || 'google',
                  providerAccountId: account?.providerAccountId || user.id,
                  access_token: account?.access_token,
                  token_type: account?.token_type,
                  scope: account?.scope,
                  id_token: account?.id_token,
                }
              }
            },
          })
          return true
        }

        // Check if this OAuth account is already linked
        const linkedAccount = existingUser.accounts.find(
          (acc: Account) => acc.provider === account?.provider && acc.providerAccountId === account?.providerAccountId
        )

        if (!linkedAccount && account) {
          // Link the new OAuth account to the existing user
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            }
          })
        }

        // Update user's image if they don't have one
        if (!existingUser.image && user.image) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { image: user.image }
          })
        }

        return true
      } catch (error) {
        console.error("Error in signIn callback:", error)
        return false
      }
    },
    async jwt({ token, user, account }) {
      try {
        if (account && user) {
          // Initial sign in
          return {
            ...token,
            accessToken: account.access_token,
            id: user.id,
          }
        }

        // On subsequent calls, verify the user still exists
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true }
        })

        if (!dbUser) {
          throw new Error('User not found in database')
        }

        return {
          ...token,
          id: dbUser.id
        }
      } catch (error) {
        console.error("Error in jwt callback:", error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (!session?.user?.email) {
          return session
        }

        // Get user from database
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          }
        })

        if (!dbUser) {
          throw new Error('User not found in database')
        }

        // Add user ID and other properties to the session
        return {
          ...session,
          user: {
            ...session.user,
            id: dbUser.id,
          }
        }
      } catch (error) {
        console.error('Error in session callback:', error)
        return session
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: getCookieDomain(),
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: getCookieDomain(),
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? `__Host-next-auth.csrf-token` : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
} 