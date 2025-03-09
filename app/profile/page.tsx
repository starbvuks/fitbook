'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Camera, Save, Loader2, Globe, Instagram, Link as LinkIcon } from 'lucide-react'
import type { UserProfile, Currency } from '@/app/models/types'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/app/components/ImageUpload'
import { formatCurrency } from '@/lib/currency'

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
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
      } catch (error) {
        console.error('Error fetching profile:', error)
        setError(error instanceof Error ? error.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      setSaving(true)
      setError(null)

      // Only send the fields that can be updated
      const updateData = {
        name: profile.name || null,
        username: profile.username || null,
        bio: profile.bio || null,
        location: profile.location || null,
        website: profile.website || null,
        instagram: profile.instagram || null,
        pinterest: profile.pinterest || null,
        tiktok: profile.tiktok || null,
        currency: profile.currency,
        language: profile.language,
        emailNotifications: profile.emailNotifications,
        publicProfile: profile.publicProfile,
        image: profile.image || null,
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Avatar and Stats */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      {profile.image ? (
                        <Image
                          src={profile.image}
                          alt={profile.name || 'Profile'}
                          fill
                          className="object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-accent-purple flex items-center justify-center text-white text-4xl">
                          {profile.name?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 right-0">
                      <div className="relative">
                        <ImageUpload
                          onUploadSuccess={handleAvatarUpload}
                          value={profile.image || undefined}
                        />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-medium mb-1">{profile.name || 'Unnamed User'}</h2>
                  <p className="text-foreground-soft">{profile.email}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Statistics</h3>
                <div className="space-y-4">
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
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground-soft">Total Spent</span>
                      <span className="font-medium">
                        {formatCurrency(profile.stats.totalSpent, profile.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-foreground-soft">Most Expensive</span>
                      <span className="font-medium">
                        {formatCurrency(profile.stats.mostExpensiveItem, profile.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={profile.username || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                      rows={3}
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={profile.location || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                      className={inputStyles}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <select
                      value={profile.currency}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, currency: e.target.value as Currency } : null)}
                      className={selectStyles}
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
                      value={profile.language}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, language: e.target.value } : null)}
                      className={selectStyles}
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
                      <label className="text-sm font-medium">Email Notifications</label>
                      <p className="text-sm text-foreground-soft">Receive updates about your wardrobe</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.emailNotifications}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, emailNotifications: e.target.checked } : null)}
                        className="w-5 h-5 rounded border-border focus:ring-accent-purple text-accent-purple"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Public Profile</label>
                      <p className="text-sm text-foreground-soft">Allow others to view your profile</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.publicProfile}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, publicProfile: e.target.checked } : null)}
                        className="w-5 h-5 rounded border-border focus:ring-accent-purple text-accent-purple"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Social Links</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      value={profile.website || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, website: e.target.value } : null)}
                      placeholder="https://"
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Instagram</label>
                    <input
                      type="text"
                      value={profile.instagram || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, instagram: e.target.value } : null)}
                      placeholder="@username"
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Pinterest</label>
                    <input
                      type="text"
                      value={profile.pinterest || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, pinterest: e.target.value } : null)}
                      placeholder="@username"
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">TikTok</label>
                    <input
                      type="text"
                      value={profile.tiktok || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, tiktok: e.target.value } : null)}
                      placeholder="@username"
                      className={inputStyles}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors disabled:opacity-50"
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