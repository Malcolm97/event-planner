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
    let unsubscribe: (() => void) | null = null;
    
    // Firestore fetch
    let q;
    if (userId) {
      q = query(collection(db, "events"), where("createdBy", "==", userId), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    }
    
    unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const data: Event[] = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Event));
        
        // Sort all events by date and time (earliest first)
        const sortedData = data.slice().sort((a, b) => {
          const getTime = (event: Event) => {
            if (event.date) return new Date(event.date).getTime();
            if (typeof event.createdAt === 'string') return new Date(event.createdAt).getTime();
            if (event.createdAt?.seconds) return event.createdAt.seconds * 1000;
            return 0;
          };
          
          return getTime(a) - getTime(b);
        });
        
        setEvents(sortedData);
        setLoading(false);
      } catch (error) {
        console.error("Error processing events:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching events:", error);
      // Fallback to RTDB if Firestore fails
      const rtdb = getDatabase();
      const eventsRef = dbRef(rtdb, "events");
      
      onValue(eventsRef, (snap) => {
        const val = snap.val();
        if (val) {
          try {
            const arr = Object.entries(val)
              .map(([id, event]) => {
                if (event && typeof event === 'object') {
                  const eventData = event as any;
                  if (userId && eventData.createdBy !== userId) {
                    return null;
                  }
                  return { id, ...eventData };
                }
                return null;
              })
              .filter(Boolean) as Event[];
            
            // Sort events
            const sortedArr = arr.slice().sort((a, b) => {
              const getTime = (event: Event) => {
                if (event.date) return new Date(event.date).getTime();
                if (typeof event.createdAt === 'string') return new Date(event.createdAt).getTime();
                if (event.createdAt?.seconds) return event.createdAt.seconds * 1000;
                return 0;
              };
              
              return getTime(a) - getTime(b);
            });
            
            setEvents(sortedArr);
          } catch (error) {
            console.error("Error processing RTDB events:", error);
            setEvents([]);
          }
        } else {
          setEvents([]);
        }
        setLoading(false);
      });
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
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
