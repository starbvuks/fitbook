import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import type { Color } from '@/app/models/types'

interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
  colors?: [string, number][]
  predominant?: {
    google?: [string, number][]
  }
}

// Configure Cloudinary with better error handling
function configureCloudinary() {
  const requiredVars = [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    throw new Error(`Missing Cloudinary environment variables: ${missingVars.join(', ')}`)
  }

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export async function POST(request: NextRequest) {
  try {
    // Configure Cloudinary first
    configureCloudinary()

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Convert File to base64
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const dataURI = `data:${file.type};base64,${base64}`

    // Test Cloudinary connection before upload
    try {
      await cloudinary.api.ping()
    } catch (error) {
      console.error('Cloudinary connection error:', error)
      return NextResponse.json(
        { error: 'Failed to connect to image service' },
        { status: 503 }
      )
    }

    // Upload to Cloudinary with enhanced color analysis
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: 'fitbook',
          colors: true,
          image_metadata: true,
          color_analysis: true,
          timeout: 60000, // 60 second timeout
        },
        (error: Error | undefined, result: CloudinaryUploadResult | undefined) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else if (result) resolve(result)
          else reject(new Error('No result from Cloudinary'))
        }
      )
    })

    // Extract and normalize colors from Cloudinary result
    let colors: Color[] = []
    
    // First try to get Google's color analysis which is usually more accurate
    if (result.predominant?.google) {
      colors = result.predominant.google.map(([hex, prevalence]) => ({
        hex: hex.startsWith('#') ? hex : `#${hex}`,
        prevalence: prevalence
      }))
    }
    // Fall back to basic color analysis if Google's is not available
    else if (result.colors) {
      colors = result.colors.map(([hex, prevalence]) => ({
        hex: hex.startsWith('#') ? hex : `#${hex}`,
        prevalence: prevalence
      }))
    }

    // Sort colors by prevalence and normalize values
    colors = colors
      .sort((a, b) => b.prevalence - a.prevalence)
      .map(color => ({
        ...color,
        prevalence: Math.round((color.prevalence + Number.EPSILON) * 1000) / 1000
      }))
      .slice(0, 6) // Limit to top 6 colors

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      colors,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 