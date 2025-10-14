/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enhanced code splitting and optimization
  experimental: {
    optimizeCss: true,
    // Enable webpack build worker
    webpackBuildWorker: true,
  },

  // Bundle analysis (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Add bundle analyzer
      if (!dev && !isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './analyze/client.html',
            openAnalyzer: false,
          })
        );
      }

      return config;
    },
  }),

  // Optimize chunks
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Split chunks more aggressively
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 20,
            },
            react: {
              test: /[\\/]node_modules[\\/]react/,
              name: 'react',
              chunks: 'all',
              priority: 30,
            },
            ui: {
              test: /[\\/]node_modules[\\/](lucide-react|react-icons|framer-motion)/,
              name: 'ui',
              chunks: 'all',
              priority: 15,
            },
          },
        },
      };
    }

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dvqmdzzekmegwzcwfara.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    // Optimize images
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Optimize output
  output: 'standalone',
  poweredByHeader: false,

  // Compression
  compress: true,

  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;
