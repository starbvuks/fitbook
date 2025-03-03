'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, Link as LinkIcon, X } from 'lucide-react'
import type { UploadResult } from '@/lib/images'

interface ImageUploadProps {
  onUploadSuccess: (result: UploadResult) => void
  onUploadError?: (error: Error) => void
  value?: string
}

export default function ImageUpload({ onUploadSuccess, onUploadError, value }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string>(value || '')
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      const error = new Error('Please upload an image file')
      setError(error.message)
      onUploadError?.(error)
      return
    }

    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const result = await response.json()
      setPreview(result.url)
      onUploadSuccess(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
      setError(errorMessage)
      onUploadError?.(error as Error)
    } finally {
      setUploading(false)
    }
  }

  const handleUrlUpload = async (url: string) => {
    if (!url) return

    setError(null)
    setUploading(true)
    try {
      // First check if the URL is valid
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
        throw new Error('Invalid image URL')
      }

      // Convert URL to File object
      const imageBlob = await fetch(url).then(r => r.blob())
      const file = new File([imageBlob], 'image.jpg', { type: imageBlob.type })
      
      await handleFileUpload(file)
      setShowUrlInput(false)
      setUrlInput('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image from URL'
      setError(errorMessage)
      onUploadError?.(error as Error)
    } finally {
      setUploading(false)
    }
  }

  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items
    let imageFile: File | null = null

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        imageFile = item.getAsFile()
        break
      }
    }

    if (imageFile) {
      event.preventDefault()
      await handleFileUpload(imageFile)
    } else {
      // Check if pasted content is a URL
      const text = event.clipboardData.getData('text')
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        event.preventDefault()
        await handleUrlUpload(text)
      }
    }
  }

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const file = event.dataTransfer.files[0]
    if (file) {
      await handleFileUpload(file)
    }
  }, [])

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div 
      className="relative"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {preview ? (
        <div className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <button
            onClick={() => {
              setPreview('')
              setError(null)
            }}
            className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-4">
          <Upload className="w-8 h-8 text-foreground-soft mb-2" />
          <p className="text-sm text-foreground-soft text-center mb-4">
            Drag and drop an image, or paste from clipboard
          </p>
          <div className="flex gap-2">
            <label className="px-4 py-2 bg-accent-purple text-white rounded-lg cursor-pointer hover:bg-accent-purple-dark transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              Choose File
            </label>
            <button
              onClick={() => setShowUrlInput(true)}
              className="px-4 py-2 bg-background-soft text-foreground-soft rounded-lg hover:bg-background-softer transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showUrlInput && (
        <div className="mt-4 flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter image URL"
            className="flex-1 px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
          />
          <button
            onClick={() => handleUrlUpload(urlInput)}
            disabled={!urlInput || uploading}
            className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {uploading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-purple border-t-transparent" />
        </div>
      )}
    </div>
  )
} 
