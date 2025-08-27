import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('id, name, date, location, venue, category, presale_price, gate_price, description, image_url, image_urls, featured, created_by, created_at')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events from Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unexpected error fetching events:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
