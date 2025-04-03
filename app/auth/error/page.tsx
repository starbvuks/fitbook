'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign in link is no longer valid.",
  OAuthCallback: "There was a problem signing in with Google.",
  OAuthCreateAccount: "Could not create an account with your Google profile.",
  OAuthAccountNotLinked: "To confirm your identity, sign in with the same account you used originally.",
  default: "An error occurred while trying to sign in.",
}

function ErrorPageContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') || 'default'
  const message = errorMessages[error] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-soft">
      <div className="max-w-md w-full space-y-8 p-8 bg-background rounded-2xl border border-border">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-red-500">Authentication Error</h2>
          <p className="mt-2 text-foreground-soft">
            {message}
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="block w-full text-center px-4 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="block w-full text-center px-4 py-3 bg-background-soft text-foreground-soft rounded-lg hover:bg-background-softer transition-colors"
          >
            Return Home
          </Link>

          <p className="text-sm text-center text-foreground-soft">
            If this problem persists, please{' '}
            <a href="mailto:support@fitbook.com" className="text-accent-purple hover:text-accent-purple-light">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-soft">
        <div className="max-w-md w-full space-y-8 p-8 bg-background rounded-2xl border border-border">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-red-500">Authentication Error</h2>
            <p className="mt-2 text-foreground-soft">Loading error details...</p>
          </div>
        </div>
      </div>
    }>
      <ErrorPageContent />
    </Suspense>
  )
} 