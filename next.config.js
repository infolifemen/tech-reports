/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/tech-reports',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;