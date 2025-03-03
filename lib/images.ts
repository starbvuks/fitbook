import type { Color } from '@/app/models/types'

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  colors: Color[]
}

// Extract dominant colors from the image URL using Cloudinary's color analysis
export async function extractColors(imageUrl: string): Promise<Color[]> {
  try {
    const response = await fetch(`/api/colors?url=${encodeURIComponent(imageUrl)}`)
    if (!response.ok) {
      throw new Error('Failed to extract colors')
    }
    return await response.json()
  } catch (error) {
    console.error('Error extracting colors:', error)
    return []
  }
}

// Helper function to get public_id from Cloudinary URL
export function getPublicIdFromUrl(url: string): string {
  const matches = url.match(/\/v\d+\/([^/]+)\.[^.]+$/)
  return matches ? matches[1] : ''
}

// Upload an image to Cloudinary
export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    return await response.json()
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}

// Delete an image from Cloudinary
export async function deleteImage(publicId: string): Promise<void> {
  try {
    const response = await fetch(`/api/upload/${publicId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete image')
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image')
  }
}

// Helper function to convert File to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
} 