'use client'

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useState, Suspense } from "react"

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"
  const error = searchParams?.get("error")
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn("google", { callbackUrl })
    } catch (error) {
      console.error("Sign in error:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-soft">
      <div className="max-w-md w-full space-y-8 p-8 bg-background rounded-2xl border border-border">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h2 className="text-3xl font-display font-bold">
              Welcome to Fitbook
            </h2>
          </Link>
          <p className="mt-2 text-foreground-soft">
            Sign in to start building your digital wardrobe
          </p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-50 rounded-lg">
            {error === "OAuthCallback"
              ? "There was a problem signing in with Google. Please try again."
              : "An error occurred while trying to sign in."}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="relative w-full flex items-center justify-center px-4 py-3 border border-border-bright rounded-lg hover:bg-accent-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="text-sm text-center text-foreground-soft">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-accent-purple hover:text-accent-purple-light">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-accent-purple hover:text-accent-purple-light">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-soft">
        <div className="max-w-md w-full space-y-8 p-8 bg-background rounded-2xl border border-border">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold">
              Welcome to Fitbook
            </h2>
            <p className="mt-2 text-foreground-soft">
              Loading sign in options...
            </p>
          </div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
} 