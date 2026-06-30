/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // prevents double-mount in dev (avoids 6 concurrent canvas rAF loops)
  images: {
    domains: [],
  },
}

module.exports = nextConfig
