/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'lh3.googleusercontent.com'],
  },
  experimental: {
    serverActions: {
      enabled: true
    }
  },
  // Optimize build output
  output: 'standalone',
  poweredByHeader: false,
}

module.exports = nextConfig 