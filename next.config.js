/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.pexels.com', 'images.unsplash.com', 'dvqmdzzekmegwzcwfara.supabase.co'],
  },
  serverExternalPackages: ['@supabase/supabase-js'],
};

module.exports = nextConfig;
