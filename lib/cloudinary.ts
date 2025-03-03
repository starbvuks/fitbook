import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary with error handling
export function configureCloudinary() {
  try {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true, // Force HTTPS
    })

    // Test the configuration
    return cloudinary.api.ping()
      .then(() => ({ success: true }))
      .catch((error) => ({ 
        success: false, 
        error: `Cloudinary connection failed: ${error.message}` 
      }))
  } catch (error) {
    return Promise.resolve({ 
      success: false, 
      error: `Cloudinary configuration error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
}

// Utility function to validate Cloudinary credentials
export async function validateCloudinaryConfig() {
  const requiredVars = [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(', ')}`)
  }

  return configureCloudinary()
}

export { cloudinary } 