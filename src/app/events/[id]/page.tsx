"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, TABLES, Event, User } from "@/lib/supabase";
import EventModal from "@/components/EventModal";

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      if (!eventId) {
        setEvent(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select("*")
        .eq("id", eventId)
        .single();
      if (error || !data) {
        setEvent(null);
        setLoading(false);
        return;
      }
      setEvent(data);
      // Fetch host
      const { data: hostData } = await supabase
        .from(TABLES.USERS)
        .select("*")
        .eq("id", data.created_by)
        .single();
      setHost(hostData || null);
      setLoading(false);
    }
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
        <p className="text-gray-500 mt-6 text-lg">Loading event details...</p>
      </div>
    );
  }
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
        <p className="text-gray-600">The event you are looking for does not exist or has been removed.</p>
        <button className="mt-6 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>
          <p className="text-gray-600">{event.description}</p>
          <button onClick={() => setDialogOpen(true)} className="mt-4 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
            View Event Details
          </button>
        </div>
      </div>
      <EventModal selectedEvent={event} host={host} dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />
    </div>
  );
}