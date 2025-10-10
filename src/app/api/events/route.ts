import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const category = searchParams.get('category');

    let query = supabase
      .from(TABLES.EVENTS)
      .select('id, name, date, location, venue, category, presale_price, gate_price, description, image_urls, featured, created_by, created_at')
      .order('date', { ascending: true });

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events from Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error fetching events:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create authenticated Supabase client
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      date,
      end_date,
      location,
      venue,
      presale_price,
      gate_price,
      category,
      image_urls
    } = body;

    // Validate required fields
    if (!name || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, date, and location are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Validate end_date if provided
    let eventEndDate = null;
    if (end_date) {
      eventEndDate = new Date(end_date);
      if (isNaN(eventEndDate.getTime())) {
        return NextResponse.json({ error: 'Invalid end_date format' }, { status: 400 });
      }
      if (eventEndDate <= eventDate) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
      }
    }

    // Validate prices
    const presalePrice = presale_price !== undefined ? parseFloat(presale_price) : null;
    const gatePrice = gate_price !== undefined ? parseFloat(gate_price) : null;

    if (presalePrice !== null && (isNaN(presalePrice) || presalePrice < 0)) {
      return NextResponse.json({ error: 'Invalid presale_price' }, { status: 400 });
    }

    if (gatePrice !== null && (isNaN(gatePrice) || gatePrice < 0)) {
      return NextResponse.json({ error: 'Invalid gate_price' }, { status: 400 });
    }

    // Validate image_urls array
    let validatedImageUrls = null;
    if (image_urls) {
      if (!Array.isArray(image_urls)) {
        return NextResponse.json({ error: 'image_urls must be an array' }, { status: 400 });
      }
      if (image_urls.length > 3) {
        return NextResponse.json({ error: 'Maximum 3 images allowed' }, { status: 400 });
      }
      validatedImageUrls = image_urls.filter(url => typeof url === 'string' && url.trim().length > 0);
    }

    // Prepare event data
    const eventData = {
      name: name.trim(),
      description: description ? description.trim() : null,
      date: eventDate.toISOString(),
      end_date: eventEndDate ? eventEndDate.toISOString() : null,
      location: location.trim(),
      venue: venue ? venue.trim() : null,
      presale_price: presalePrice,
      gate_price: gatePrice,
      category: category ? category.trim() : null,
      image_urls: validatedImageUrls,
      created_by: user.id,
    };

    // Insert event into database
    const { data, error } = await supabaseAuth
      .from(TABLES.EVENTS)
      .insert(eventData)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error creating event:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
