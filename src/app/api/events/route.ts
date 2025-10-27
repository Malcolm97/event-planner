import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  handleSupabaseError,
  validationError,
  authenticationError,
  authorizationError,
  databaseError,
  createdResponse,
  successResponse
} from '@/lib/errorHandler';
import { validateRequiredFields, sanitizeString, validateDate, validatePrice } from '@/lib/errorHandler';

// Function to send push notifications for new events
async function sendPushNotificationForNewEvent(event: any) {
  try {
    // Call the send-push-notification API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'New Event Added!',
        body: `${event.name} - ${new Date(event.date).toLocaleDateString()}`,
        url: `/events/${event.id}`,
        eventId: event.id
      })
    });

    if (!response.ok) {
      console.error('Failed to send push notifications:', response.status);
    } else {
      const result = await response.json();
      console.log(`Push notifications sent: ${result.sent || 0} successful`);
    }
  } catch (err) {
    console.error('Error sending push notifications:', err);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const category = searchParams.get('category');
    const fields = searchParams.get('fields');
    const upcoming = searchParams.get('upcoming');

    // Define default fields for performance - only fetch what's needed
    const defaultFields = 'id, name, description, date, end_date, location, venue, category, presale_price, gate_price, image_urls, featured, created_by, created_at, updated_at';
    const selectedFields = fields || defaultFields;

    let query = supabase
      .from(TABLES.EVENTS)
      .select(selectedFields)
      .order('date', { ascending: true });

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Filter for upcoming events only if requested
    if (upcoming === 'true') {
      const now = new Date().toISOString();
      query = query.gte('date', now);
    }

    // Apply pagination
    if (offset) {
      const offsetNum = parseInt(offset, 10);
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        query = query.range(offsetNum, offsetNum + (limit ? parseInt(limit, 10) : 50) - 1);
      }
    } else if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) { // Max 100 items per request
        query = query.limit(limitNum);
      }
    } else {
      // Default limit for performance
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error: any) {
    console.error('Unexpected error fetching events:', error.message);
    return databaseError('Failed to fetch events');
  }
}

export async function POST(request: Request) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return authenticationError();
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
      return authenticationError();
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
    const missingFields = validateRequiredFields({ name, date, location }, ['name', 'date', 'location']);
    if (missingFields.length > 0) {
      return validationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate and sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedDescription = description ? sanitizeString(description) : null;
    const sanitizedLocation = sanitizeString(location);
    const sanitizedVenue = venue ? sanitizeString(venue) : null;
    const sanitizedCategory = category ? sanitizeString(category) : null;

    if (!sanitizedName || !sanitizedLocation) {
      return validationError('Name and location cannot be empty');
    }

    // Validate date format
    if (!validateDate(date)) {
      return validationError('Invalid date format');
    }
    const eventDate = new Date(date);

    // Validate end_date if provided
    let eventEndDate = null;
    if (end_date) {
      if (!validateDate(end_date)) {
        return validationError('Invalid end_date format');
      }
      eventEndDate = new Date(end_date);
      if (eventEndDate <= eventDate) {
        return validationError('End date must be after start date');
      }
    }

    // Validate prices
    if (presale_price !== undefined && !validatePrice(presale_price)) {
      return validationError('Invalid presale_price');
    }
    if (gate_price !== undefined && !validatePrice(gate_price)) {
      return validationError('Invalid gate_price');
    }

    const presalePrice = presale_price !== undefined ? parseFloat(presale_price) : null;
    const gatePrice = gate_price !== undefined ? parseFloat(gate_price) : null;

    // Validate image_urls array
    let validatedImageUrls = null;
    if (image_urls) {
      if (!Array.isArray(image_urls)) {
        return validationError('image_urls must be an array');
      }
      if (image_urls.length > 3) {
        return validationError('Maximum 3 images allowed');
      }
      validatedImageUrls = image_urls.filter(url => typeof url === 'string' && url.trim().length > 0);
    }

    // Prepare event data
    const eventData = {
      name: sanitizedName,
      description: sanitizedDescription,
      date: eventDate.toISOString(),
      end_date: eventEndDate ? eventEndDate.toISOString() : null,
      location: sanitizedLocation,
      venue: sanitizedVenue,
      presale_price: presalePrice,
      gate_price: gatePrice,
      category: sanitizedCategory,
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
      return handleSupabaseError(error);
    }

    // Trigger push notifications for new event (don't await to avoid blocking response)
    sendPushNotificationForNewEvent(data).catch(err => {
      console.error('Failed to send push notification for new event:', err);
    });

    return createdResponse(data);
  } catch (error: any) {
    console.error('Unexpected error creating event:', error.message);
    return databaseError('Failed to create event');
  }
}
