'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Camera, Save, Loader2, Globe, Instagram, Link as LinkIcon } from 'lucide-react'
import type { UserProfile, Currency } from '@/app/models/types'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/app/components/ImageUpload'
import { formatCurrency } from '@/lib/currency'
import PriceDisplay from '@/app/components/PriceDisplay'
import { toast } from '@/components/ui/use-toast'

const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD']
const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
]

interface ProfileData {
  id: string
  name: string | null
  username: string | null
  email: string
  image: string | null
  bio: string | null
  location: string | null
  website: string | null
  instagram: string | null
  pinterest: string | null
  tiktok: string | null
  currency: Currency
  language: string
  emailNotifications: boolean
  publicProfile: boolean
  stats: {
    itemCount: number
    outfitCount: number
    lookbookCount: number
    totalSpent: number
    mostExpensiveItem: number
  }
}

const inputStyles = "w-full px-4 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"
const selectStyles = "w-full px-4 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [pendingCurrency, setPendingCurrency] = useState<Currency | null>(null)
  const [convertedTotalSpent, setConvertedTotalSpent] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/profile')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch profile')
      }

      const data = await response.json()
      setProfile(data)
      setPendingCurrency(data.currency)
      setConvertedTotalSpent(null)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  useEffect(() => {
    const previewConversion = async () => {
      if (!profile?.stats?.totalSpent || !pendingCurrency || pendingCurrency === profile.currency) {
        setConvertedTotalSpent(null)
        return
      }

      try {
        const response = await fetch('/api/currency/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: profile.stats.totalSpent,
            fromCurrency: profile.currency,
            toCurrency: pendingCurrency
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to convert currency')
        }
        
        const { amount: convertedAmount } = await response.json()
        setConvertedTotalSpent(convertedAmount)
      } catch (error) {
        console.error('Error converting currency:', error)
        setConvertedTotalSpent(null)
        toast({
          title: "Error",
          description: "Failed to preview currency conversion",
          variant: "destructive",
        })
      }
    }

    previewConversion()
  }, [pendingCurrency, profile?.currency, profile?.stats?.totalSpent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      setSaving(true)
      setError(null)

      // First convert the amount if needed
      let finalTotalSpent = profile.stats.totalSpent
      if (pendingCurrency && pendingCurrency !== profile.currency) {
        try {
          const convertResponse = await fetch('/api/currency/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: profile.stats.totalSpent,
              fromCurrency: profile.currency,
              toCurrency: pendingCurrency
            })
          })

          if (!convertResponse.ok) {
            const error = await convertResponse.json()
            throw new Error(error.message || 'Failed to convert currency')
          }

          const { amount: convertedAmount } = await convertResponse.json()
          finalTotalSpent = convertedAmount
        } catch (error) {
          console.error('Error converting currency:', error)
          toast({
            title: "Error",
            description: "Failed to convert currency. Please try again.",
            variant: "destructive",
          })
          return
        }
      }

      // Now update the profile with the converted amount
      const updateData = {
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        instagram: profile.instagram,
        pinterest: profile.pinterest,
        tiktok: profile.tiktok,
        currency: pendingCurrency || profile.currency,
        language: profile.language,
        emailNotifications: profile.emailNotifications,
        publicProfile: profile.publicProfile,
        image: profile.image,
        stats: {
          ...profile.stats,
          totalSpent: finalTotalSpent
        }
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update profile')
      }

      // After successful update, fetch the fresh profile data
      await fetchProfile()
      router.refresh()

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (result: { url: string }) => {
    if (!profile) return

    try {
      setProfile(prev => prev ? { ...prev, image: result.url } : null)
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    } catch (error) {
      console.error('Error updating avatar:', error)
      setError('Failed to update avatar')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-16 bg-background-soft">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-8">
            <div className="h-32 w-32 bg-background-soft rounded-full" />
            <div className="space-y-4">
              <div className="h-8 bg-background-soft rounded w-1/4" />
              <div className="h-4 bg-background-soft rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen pt-16 bg-background-soft">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500">Error</h1>
            <p className="text-foreground-soft">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Avatar and Stats */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {profile.image ? (
                      <Image
                        src={profile.image}
                        alt="Profile"
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center">
                        <span className="text-4xl text-gray-400">?</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAvatarUpload(true)}
                      className="absolute bottom-0 right-0 p-2 bg-accent-purple text-white rounded-full hover:bg-accent-purple-dark transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {profile.name || 'Anonymous'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-gray-900 dark:text-white">Statistics</h3>
                <div className="space-y-3 sm:space-y-4">
                  {profile?.stats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-foreground-soft">Items</span>
                        <span className="font-medium">{profile.stats.itemCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-foreground-soft">Outfits</span>
                        <span className="font-medium">{profile.stats.outfitCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-foreground-soft">Lookbooks</span>
                        <span className="font-medium">{profile.stats.lookbookCount}</span>
                      </div>
                      <div className="border-t border-border pt-3 sm:pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-foreground-soft">Total Spent</span>
                          <span className="font-medium">
                            <PriceDisplay
                              amount={profile.stats.totalSpent}
                              currency={profile.currency}
                              userCurrency={pendingCurrency || profile.currency}
                              showOriginal={pendingCurrency !== profile.currency}
                              showTooltip={true}
                            />
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-gray-900 dark:text-white">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className={`${inputStyles} h-10 sm:h-11`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                      rows={3}
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={profile.location || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                      className={`${inputStyles} h-10 sm:h-11`}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-gray-900 dark:text-white">Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Currency</label>
                    <select
                      value={pendingCurrency || profile?.currency}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPendingCurrency(e.target.value as Currency)}
                      className={`${selectStyles} h-10 sm:h-11`}
                    >
                      {currencies.map(currency => (
                        <option key={currency} value={currency} className="dark:bg-background">
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select
                      disabled
                      value={profile.language}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProfile(prev => prev ? { ...prev, language: e.target.value } : null)}
                      className={`${selectStyles} h-10 sm:h-11`}
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code} className="dark:bg-background">
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Public Profile</label>
                      <p className="text-xs sm:text-sm text-foreground-soft">Allow others to view your profile</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.publicProfile}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => prev ? { ...prev, publicProfile: e.target.checked } : null)}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded border-border focus:ring-accent-purple text-accent-purple"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 