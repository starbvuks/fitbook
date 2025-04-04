import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient, Account } from "@prisma/client"
import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const prisma = new PrismaClient()

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
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
} 