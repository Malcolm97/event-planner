import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import EventCard, { Event } from "./EventCard";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";

interface EventsListProps {
  userId?: string; // If provided, only show events created by this user
}

export default function EventsList({ userId }: EventsListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    setLoading(true);
    let unsubFirestore: (() => void) | null = null;
    let unsubRTDB: (() => void) | null = null;
    let didSet = false;
    // Firestore fetch
    let q;
    if (userId) {
      q = query(collection(db, "events"), where("createdBy", "==", userId), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    }
    unsubFirestore = onSnapshot(q, (snapshot) => {
      const data: Event[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      // Sort all events by date and time (earliest first)
      const sortedData = data.slice().sort((a, b) => {
        const aTime = a.date ? Date.parse(a.date) : (typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0));
        const bTime = b.date ? Date.parse(b.date) : (typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0));
        return aTime - bTime;
      });
      if (!didSet && sortedData.length > 0) {
        setEvents(sortedData);
        setLoading(false);
        didSet = true;
      }
    });
    // RTDB fetch (in parallel, but only set if Firestore hasn't set)
    const rtdb = getDatabase();
    const eventsRef = dbRef(rtdb, "events");
    unsubRTDB = onValue(eventsRef, (snap) => {
      if (didSet) return; // If Firestore already returned, skip RTDB
      const val = snap.val();
      if (val) {
        const arr = Object.entries(val)
          .map(([id, event]) => {
            if (event && typeof event === 'object') {
              return { id, ...event };
            }
            return null;
          })
          .filter(Boolean) as Event[];
        // Sort all events by date and time (earliest first)
        const sortedArr = arr.slice().sort((a, b) => {
          const aTime = a.date ? Date.parse(a.date) : (typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0));
          const bTime = b.date ? Date.parse(b.date) : (typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0));
          return aTime - bTime;
        });
        setEvents(sortedArr);
        setLoading(false);
        didSet = true;
      } else {
        setEvents([]);
        setLoading(false);
      }
    });
    return () => {
      if (unsubFirestore) unsubFirestore();
      if (unsubRTDB) unsubRTDB();
    };
  }, [userId]);

  if (loading) return <div className="text-gray-500 dark:text-gray-400">Loading events...</div>;
  if (events.length === 0) return <div className="text-gray-500 dark:text-gray-400">No events found.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
