'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Camera, Save, Loader2, Globe, Instagram, Link as LinkIcon } from 'lucide-react'
import type { UserProfile, Currency } from '@/app/models/types'
import Toggle from '@/app/components/Toggle'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/app/components/ImageUpload'

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
  darkMode: boolean
  stats: {
    itemCount: number
    outfitCount: number
    lookbookCount: number
    totalSpent: number
    mostExpensiveItem: number
  }
}

const currencyMap: Record<Currency, { symbol: string }> = {
  USD: { symbol: '$' },
  EUR: { symbol: '€' },
  GBP: { symbol: '£' },
  JPY: { symbol: '¥' },
  INR: { symbol: '₹' },
  CAD: { symbol: '$' },
  AUD: { symbol: '$' },
}

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
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          instagram: profile.instagram,
          pinterest: profile.pinterest,
          tiktok: profile.tiktok,
          currency: profile.currency,
          language: profile.language,
          emailNotifications: profile.emailNotifications,
          publicProfile: profile.publicProfile,
          darkMode: profile.darkMode,
          image: profile.image,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
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
            <p className="text-foreground-soft">{error || 'Failed to load profile'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Profile Settings</h1>
          <p className="text-foreground-soft">Manage your account preferences and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Avatar and Stats */}
          <div className="space-y-6">
            <div className="bg-background rounded-lg border border-border p-6">
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

            <div className="bg-background rounded-lg border border-border p-6">
              <h3 className="text-lg font-medium mb-4">Statistics</h3>
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
                      {currencyMap[profile.currency].symbol} {profile.stats.totalSpent.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-foreground-soft">Most Expensive</span>
                    <span className="font-medium">
                      {currencyMap[profile.currency].symbol} {profile.stats.mostExpensiveItem.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 text-red-500 bg-red-50 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-background rounded-lg border border-border p-6 space-y-6">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={e => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={profile.username || ''}
                      onChange={e => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                      className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={e => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    rows={3}
                    className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={profile.location || ''}
                    onChange={e => setProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                    className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={e => setProfile(prev => prev ? { ...prev, website: e.target.value } : null)}
                    className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="bg-background rounded-lg border border-border p-6 space-y-6">
                <h3 className="text-lg font-medium">Social Links</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Instagram</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-background-soft text-foreground-soft">
                      @
                    </span>
                    <input
                      type="text"
                      value={profile.instagram || ''}
                      onChange={e => setProfile(prev => prev ? { ...prev, instagram: e.target.value } : null)}
                      className="flex-1 px-4 py-2 bg-background-soft rounded-r-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Pinterest</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-background-soft text-foreground-soft">
                      @
                    </span>
                    <input
                      type="text"
                      value={profile.pinterest || ''}
                      onChange={e => setProfile(prev => prev ? { ...prev, pinterest: e.target.value } : null)}
                      className="flex-1 px-4 py-2 bg-background-soft rounded-r-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">TikTok</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-background-soft text-foreground-soft">
                      @
                    </span>
                    <input
                      type="text"
                      value={profile.tiktok || ''}
                      onChange={e => setProfile(prev => prev ? { ...prev, tiktok: e.target.value } : null)}
                      className="flex-1 px-4 py-2 bg-background-soft rounded-r-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg border border-border p-6 space-y-6">
                <h3 className="text-lg font-medium">Preferences</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    value={profile.currency}
                    onChange={e => setProfile(prev => prev ? { ...prev, currency: e.target.value as Currency } : null)}
                    className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    value={profile.language}
                    onChange={e => setProfile(prev => prev ? { ...prev, language: e.target.value } : null)}
                    className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="zh">中文</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <Toggle
                    checked={profile.emailNotifications}
                    onChange={checked => setProfile(prev => prev ? { ...prev, emailNotifications: checked } : null)}
                    label="Email Notifications"
                  />
                  <Toggle
                    checked={profile.publicProfile}
                    onChange={checked => setProfile(prev => prev ? { ...prev, publicProfile: checked } : null)}
                    label="Public Profile"
                  />
                  <Toggle
                    checked={profile.darkMode}
                    onChange={checked => setProfile(prev => prev ? { ...prev, darkMode: checked } : null)}
                    label="Dark Mode"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-accent-purple text-white rounded-lg font-medium hover:bg-accent-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 