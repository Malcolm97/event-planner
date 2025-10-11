'use client';

import dynamic from 'next/dynamic';
import { EventItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const HomePageContent = dynamic(() => import('./HomePageContent'), { ssr: false });

interface ClientHomePageWrapperProps {
    initialEvents: EventItem[];
    initialTotalEvents: number | null;
    initialTotalUsers: number | null;
    initialCitiesCovered: number | null;
}

export default function ClientHomePageWrapper(props: ClientHomePageWrapperProps) {
    const router = useRouter();

    useEffect(() => {
        // Check landing page preference and redirect if needed
        const landing = localStorage.getItem('landing') || 'home';

        // Validate landing page routes
        const validRoutes = ['home', 'events', 'categories', 'dashboard'];
        if (landing !== 'home' && validRoutes.includes(landing)) {
            // Check if dashboard is accessible (user logged in)
            if (landing === 'dashboard') {
                // For dashboard, we need to check if user is logged in
                // This will be handled by the page itself, so we can redirect
                router.replace(`/${landing}`);
            } else {
                router.replace(`/${landing}`);
            }
        }
    }, [router]);

    return <HomePageContent {...props} />;
}
