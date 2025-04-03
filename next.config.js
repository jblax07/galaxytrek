/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force trailing slash to improve routing
  trailingSlash: true,
  
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configure module resolution
  webpack: (config, { isServer }) => {
    // Add fallback aliases for common paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': require('path').resolve('./components'),
      '@/app': require('path').resolve('./app'),
      '@/lib': require('path').resolve('./lib'),
    };
    
    return config;
  },
  
  // Suppress image optimization warnings if any
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig; 