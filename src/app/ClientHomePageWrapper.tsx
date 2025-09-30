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
        if (landing !== 'home') {
            router.replace(`/${landing}`);
        }
    }, [router]);

    return <HomePageContent {...props} />;
}
