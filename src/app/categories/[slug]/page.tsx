import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SITE_CONFIG, PRIMARY_KEYWORDS, categoryToSlug, slugToCategory } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import CategoriesPageContent from '../CategoriesPageContent';
import { allCategories, getInitialData } from '../page';

type CategoryRouteProps = {
  params: Promise<{ slug: string }>;
};

function getCategoryNameFromSlug(slug: string): string | null {
  const validCategories = allCategories
    .map((category) => category.name)
    .filter((name) => name !== 'All Events');

  return slugToCategory(slug, validCategories);
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = getCategoryNameFromSlug(slug);

  if (!categoryName) {
    return {
      title: 'Category Not Found | PNG Events',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${categoryName} Events in Papua New Guinea`;
  const description = `Find upcoming ${categoryName.toLowerCase()} events happening across Papua New Guinea. Discover what is on and plan your next event in PNG.`;
  const canonicalUrl = `${SITE_CONFIG.url}/categories/${categoryToSlug(categoryName)}`;

  return {
    title,
    description,
    keywords: [
      ...PRIMARY_KEYWORDS,
      `${categoryName.toLowerCase()} events PNG`,
      `${categoryName.toLowerCase()} events Papua New Guinea`,
      `${categoryName.toLowerCase()} events Port Moresby`,
    ].join(', '),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: `${SITE_CONFIG.url}/icons/screenshot-desktop.png`,
          width: 1280,
          height: 720,
          alt: `${categoryName} events in Papua New Guinea`,
        },
      ],
      siteName: 'PNG Events',
      locale: 'en_PG',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@pngevents',
      creator: '@pngevents',
      title,
      description,
      images: [`${SITE_CONFIG.url}/icons/screenshot-desktop.png`],
    },
  };
}

export default async function CategorySlugPage({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const categoryName = getCategoryNameFromSlug(slug);

  if (!categoryName) {
    notFound();
  }

  const { events, totalEvents, totalUsers, citiesCovered } = await getInitialData();

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Categories', url: '/categories' },
    { name: categoryName, url: `/categories/${slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />

      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="text-gray-500 mt-6 text-lg">Loading category events...</p>
            </div>
          </div>
        }
      >
        <CategoriesPageContent
          initialEvents={events}
          initialDisplayCategories={allCategories}
          initialTotalEvents={totalEvents}
          initialTotalUsers={totalUsers}
          initialCitiesCovered={citiesCovered}
          initialSelectedCategory={categoryName}
        />
      </Suspense>
    </>
  );
}
