'use client';

import dynamic from 'next/dynamic';
import { EventItem } from '@/lib/types';

const HomePageContent = dynamic(() => import('./HomePageContent'), { ssr: false });

interface ClientHomePageWrapperProps {
    initialEvents: EventItem[];
    initialTotalEvents: number | null;
    initialTotalUsers: number | null;
    initialCitiesCovered: number | null;
}

export default function ClientHomePageWrapper(props: ClientHomePageWrapperProps) {
    return <HomePageContent {...props} />;
}
