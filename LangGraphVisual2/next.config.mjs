/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "frame-src 'self' https://docs.google.com https://www.google.com https://*.google.com https://*.gstatic.com; child-src 'self' https://docs.google.com https://www.google.com https://*.google.com https://*.gstatic.com;",
          },
        ],
      },
    ]
  },
}

export default nextConfig
