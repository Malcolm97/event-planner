// Public Profile Page for PNG Events
// This page will fetch and display a user's public profile and their events.

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EventCard from '@/components/EventCard';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface ProfileProps {
  params: { uid: string };
}

export default async function ProfilePage({ params }: ProfileProps) {
  const { uid } = params;

  // Fetch user profile
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return notFound();
  const user = userSnap.data();

  // Fetch user's events
  const eventsQuery = query(collection(db, 'events'), where('createdBy', '==', uid));
  const eventsSnap = await getDocs(eventsQuery);
  const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
          {user.photoURL ? (
            <Image src={user.photoURL} alt={user.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-primary">
              {user.name?.[0] || '?'}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold">{user.name || 'Unnamed User'}</h1>
        {user.company && <p className="text-primary font-medium">{user.company}</p>}
        {user.about && <p className="text-gray-600 text-center max-w-md">{user.about}</p>}
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Events by {user.name || 'this user'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {events.length > 0 ? (
            events.map((event: any) => <EventCard key={event.id} event={event} />)
          ) : (
            <p className="text-gray-500">No events found.</p>
          )}
        </div>
      </section>
    </main>
  );
}

export async function generateStaticParams() {
  // Optionally pre-render some profiles
  return [];
}
