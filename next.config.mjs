/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dvqmdzzekmegwzcwfara.supabase.co',
      },
    ],
  },
};

export default nextConfig;
