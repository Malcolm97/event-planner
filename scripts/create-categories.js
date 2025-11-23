#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCategories() {
  console.log('Creating sample categories...');

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
      console.error(`Error creating category ${category.name}:`, error);
    } else {
      console.log(`✅ Created category: ${category.name}`);
    }
  }

  console.log('Done!');
}

createCategories().catch(console.error);
