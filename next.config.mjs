/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/diqddvoy/image/upload/**', // Adjust pathname if needed
      },
      // Add other patterns if necessary
    ],
  },
}

export default nextConfig;
