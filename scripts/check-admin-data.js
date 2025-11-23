#!/usr/bin/env node

/**
 * Check Admin Data Script
 * Check what data exists in the admin tables and add sample data if needed
 *
 * Usage: node check-admin-data.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminData() {
  console.log('🔍 Checking admin data...\n');

  try {
    // Check profiles (users)
    console.log('⏳ Checking profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profiles`);
      if (profiles && profiles.length > 0) {
        profiles.forEach(profile => {
          console.log(`   - ${profile.full_name || 'No name'} (${profile.role || 'user'})`);
        });
      }
    }

    // Check events
    console.log('\n⏳ Checking events...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(5);

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
    } else {
      console.log(`✅ Found ${events?.length || 0} events`);
      if (events && events.length > 0) {
        events.forEach(event => {
          console.log(`   - ${event.name || event.title} (${event.approved ? 'approved' : 'pending'})`);
        });
      }
    }

    // Check categories
    console.log('\n⏳ Checking categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
    } else {
      console.log(`✅ Found ${categories?.length || 0} categories`);
      if (categories && categories.length > 0) {
        categories.forEach(category => {
          console.log(`   - ${category.name}`);
        });
      }
    }

    // Check activities
    console.log('\n⏳ Checking activities...');
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .limit(5);

    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError);
    } else {
      console.log(`✅ Found ${activities?.length || 0} activities`);
    }

    // Create sample categories if they don't exist
    const hasData = (profiles?.length || 0) > 0 || (events?.length || 0) > 0 || (categories?.length || 0) > 0;

    if (!hasData) {
      console.log('\n📝 No data found. Creating sample data...\n');

      // Create sample categories
      console.log('⏳ Creating sample categories...');
      const sampleCategories = [
        { name: 'Music', description: 'Music events and concerts' },
        { name: 'Sports', description: 'Sports events and games' },
        { name: 'Technology', description: 'Tech conferences and meetups' },
        { name: 'Food & Drink', description: 'Food festivals and tastings' },
        { name: 'Arts', description: 'Art exhibitions and performances' }
      ];

      for (const category of sampleCategories) {
        const { error } = await supabase
          .from('categories')
          .insert(category);

        if (error) {
          console.error(`❌ Error creating category ${category.name}:`, error);
        } else {
          console.log(`✅ Created category: ${category.name}`);
        }
      }

      // Create sample events
      console.log('\n⏳ Creating sample events...');
      const sampleEvents = [
        {
          name: 'Summer Music Festival',
          category: 'Music',
          location: 'Port Moresby, Papua New Guinea',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          description: 'A fantastic music festival featuring local and international artists.',
          approved: true
        },
        {
          name: 'Tech Conference 2024',
          category: 'Technology',
          location: 'Port Moresby, Papua New Guinea',
          date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
          description: 'Latest trends in technology and innovation.',
          approved: true
        },
        {
          name: 'Food Festival',
          category: 'Food & Drink',
          location: 'Lae, Papua New Guinea',
          date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
          description: 'Taste the best local cuisine from Papua New Guinea.',
          approved: false
        },
        {
          name: 'Art Exhibition',
          category: 'Arts',
          location: 'Madang, Papua New Guinea',
          date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
          description: 'Contemporary art from local artists.',
          approved: true
        },
        {
          name: 'Sports Tournament',
          category: 'Sports',
          location: 'Kokopo, Papua New Guinea',
          date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
          description: 'Annual sports tournament featuring multiple disciplines.',
          approved: false
        }
      ];

      for (const event of sampleEvents) {
        const { error } = await supabase
          .from('events')
          .insert(event);

        if (error) {
          console.error(`❌ Error creating event ${event.name}:`, error);
        } else {
          console.log(`✅ Created event: ${event.name}`);
        }
      }

      console.log('\n🎉 Sample data created successfully!');
      console.log('You can now view the data in the admin pages.');
    } else {
      console.log('\n✅ Data already exists in the database.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkAdminData().catch(console.error);
