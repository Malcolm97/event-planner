'use client';

import { supabase, TABLES } from '../../lib/supabase';
import { EventItem } from '@/lib/types';
import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Loading from './loading'; // Import the Loading component

// Dynamic import for better code splitting
const EventsPageContent = dynamic(() => import('./EventsPageContent'), {
  loading: () => <Loading />,
  ssr: false
});

export default function EventsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <EventsPageContent />
    </Suspense>
  );
}
