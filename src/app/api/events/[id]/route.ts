import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Function to send push notifications for updated events to users who saved them
async function sendPushNotificationForUpdatedEvent(event: any) {
  try {
    // Get all users who saved this event
    const { data: savedEvents, error: savedError } = await supabase
      .from(TABLES.SAVED_EVENTS)
      .select('user_id')
      .eq('event_id', event.id);

    if (savedError || !savedEvents || savedEvents.length === 0) {
      console.log(`No users have saved event ${event.id}, skipping notifications`);
      return;
    }

    // Get push subscriptions for these users
    const userIds = savedEvents.map(se => se.user_id);
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')
      .in('user_id', userIds);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for users who saved event ${event.id}`);
      return;
    }

    // Call the send-push-notification API with targeted subscriptions
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Event Updated!',
        body: `${event.name} has been updated`,
        url: `/events/${event.id}`,
        eventId: event.id,
        targetSubscriptions: subscriptions // Send to specific users only
      })
    });

    if (!response.ok) {
      console.error('Failed to send push notifications for updated event:', response.status);
    } else {
      const result = await response.json();
      console.log(`Push notifications sent for updated event: ${result.sent || 0} successful`);
    }
  } catch (err) {
    console.error('Error sending push notifications for updated event:', err);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event from Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unexpected error fetching event:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check if event exists and user owns it
    const { data: existingEvent, error: fetchError } = await supabaseAuth
      .from(TABLES.EVENTS)
      .select('created_by, image_urls')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      console.error('Error fetching event:', fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existingEvent.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own events' }, { status: 403 });
    }

    // Delete associated images from storage if they exist
    if (existingEvent.image_urls && Array.isArray(existingEvent.image_urls) && existingEvent.image_urls.length > 0) {
      const filePathsToDelete = existingEvent.image_urls.map(url => {
        // Extract the file path from the public URL
        // Assuming the path is '.../storage/v1/object/public/event-images/fileName.ext'
        // We need 'event-images/fileName.ext'
        const pathSegments = url.split('/');
        const bucketIndex = pathSegments.indexOf('event-images');
        if (bucketIndex > -1 && bucketIndex + 1 < pathSegments.length) {
          return pathSegments.slice(bucketIndex).join('/');
        }
        return ''; // Should not happen if URLs are consistent
      }).filter(Boolean); // Remove empty strings

      if (filePathsToDelete.length > 0) {
        const { error: deleteError } = await supabaseAuth.storage
          .from('event-images')
          .remove(filePathsToDelete);

        if (deleteError) {
          console.error('Error deleting event images:', deleteError.message);
          // Don't fail the entire operation if image deletion fails
          // The event will still be deleted
        }
      }
    }

    // Delete event from database
    const { error } = await supabaseAuth
      .from(TABLES.EVENTS)
      .delete()
      .eq('id', id)
      .eq('created_by', user.id); // Extra safety check

    if (error) {
      console.error('Error deleting event:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Unexpected error deleting event:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check if event exists and user owns it
    const { data: existingEvent, error: fetchError } = await supabaseAuth
      .from(TABLES.EVENTS)
      .select('created_by, date, end_date')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      console.error('Error fetching event:', fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existingEvent.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own events' }, { status: 403 });
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

    // Validate date format if provided
    let eventDate = null;
    if (date) {
      eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
    }

    // Validate end_date if provided
    let eventEndDate = null;
    if (end_date) {
      eventEndDate = new Date(end_date);
      if (isNaN(eventEndDate.getTime())) {
        return NextResponse.json({ error: 'Invalid end_date format' }, { status: 400 });
      }
      const checkDate = eventDate || new Date(existingEvent.date);
      if (eventEndDate <= checkDate) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
      }
    }

    // Validate prices if provided
    let presalePrice = null;
    let gatePrice = null;

    if (presale_price !== undefined) {
      presalePrice = parseFloat(presale_price);
      if (isNaN(presalePrice) || presalePrice < 0) {
        return NextResponse.json({ error: 'Invalid presale_price' }, { status: 400 });
      }
    }

    if (gate_price !== undefined) {
      gatePrice = parseFloat(gate_price);
      if (isNaN(gatePrice) || gatePrice < 0) {
        return NextResponse.json({ error: 'Invalid gate_price' }, { status: 400 });
      }
    }

    // Validate image_urls array if provided
    let validatedImageUrls = undefined;
    if (image_urls !== undefined) {
      if (!Array.isArray(image_urls)) {
        return NextResponse.json({ error: 'There was a problem with your images. Please try selecting them again.' }, { status: 400 });
      }
      if (image_urls.length > 3) {
        return NextResponse.json({ error: 'You can only upload up to 3 images per event.' }, { status: 400 });
      }
      validatedImageUrls = image_urls.filter(url => typeof url === 'string' && url.trim().length > 0);
    }

    // Prepare update data (only include fields that were provided)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (eventDate) updateData.date = eventDate.toISOString();
    if (end_date !== undefined) updateData.end_date = eventEndDate ? eventEndDate.toISOString() : null;
    if (location !== undefined) updateData.location = location.trim();
    if (venue !== undefined) updateData.venue = venue ? venue.trim() : null;
    if (presalePrice !== null) updateData.presale_price = presalePrice;
    if (gatePrice !== null) updateData.gate_price = gatePrice;
    if (category !== undefined) updateData.category = category ? category.trim() : null;
    if (validatedImageUrls !== undefined) updateData.image_urls = validatedImageUrls;

    // Update event in database
    const { data, error } = await supabaseAuth
      .from(TABLES.EVENTS)
      .update(updateData)
      .eq('id', id)
      .eq('created_by', user.id) // Extra safety check
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger push notifications for updated event (don't await to avoid blocking response)
    sendPushNotificationForUpdatedEvent(data).catch(err => {
      console.error('Failed to send push notification for updated event:', err);
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unexpected error updating event:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
