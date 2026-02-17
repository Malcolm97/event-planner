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
        // Only run on initial mount, not on every render
        const landing = localStorage.getItem('landing') || 'home';

        // Validate landing page routes
        const validRoutes = ['home', 'events', 'categories', 'dashboard'];
        
        // Don't redirect if we're already on the target page or on home
        if (landing === 'home' || landing === '') {
            return;
        }
        
        if (validRoutes.includes(landing)) {
            // Check if we're already on the target route to prevent redirect loops
            const currentPath = window.location.pathname;
            const targetPath = `/${landing}`;
            
            if (currentPath !== targetPath && currentPath !== '/') {
                return; // Already navigating somewhere else
            }
            
            if (currentPath === '/') {
                // Only redirect from home page
                if (landing === 'dashboard') {
                    // For dashboard, we need to check if user is logged in
                    // This will be handled by the page itself, so we can redirect
                    router.replace(`/${landing}`);
                } else {
                    router.replace(`/${landing}`);
                }
            }
        }
    }, [router]);

    return <HomePageContent {...props} />;
}
