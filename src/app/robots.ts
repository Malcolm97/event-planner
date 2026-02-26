import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/events',
          '/events/*',
          '/categories',
          '/about',
          '/creators',
          '/profile/*',
          '/signin',
          '/create-event',
          '/privacy',
          '/terms',
          '/download',
          '/api/events',
          '/api/creators',
          '/api/stats',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/dashboard',
          '/dashboard/*',
          '/settings',
          '/settings/*',
          '/api/admin',
          '/api/admin/*',
          '/api/auth',
          '/api/auth/*',
          '/api/export',
          '/api/export/*',
          '/_next',
          '/_next/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/settings', '/api/admin', '/api/auth'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/settings', '/api/admin', '/api/auth'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}