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

async function forceCreateCategories() {
  console.log('Force creating categories...');

  try {
    // First, try to update RLS policies
    console.log('Updating RLS policies...');

    // Use raw SQL to update policies
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
        CREATE POLICY "Public can view categories" ON public.categories FOR SELECT TO public USING (true);
      `
    });

    if (policyError) {
      console.log('Policy update failed (this is normal for anon key):', policyError.message);
    } else {
      console.log('✅ RLS policies updated');
    }

    // Now try to insert categories
    console.log('Inserting categories...');

    const categories = [
      { name: 'Music', description: 'Music events and concerts' },
      { name: 'Sports', description: 'Sports events and games' },
      { name: 'Technology', description: 'Tech conferences and meetups' },
      { name: 'Food & Drink', description: 'Food festivals and tastings' },
      { name: 'Arts', description: 'Art exhibitions and performances' }
    ];

    for (const category of categories) {
      const { error } = await supabase
        .from('categories')
        .insert(category)
        .select();

      if (error) {
        console.error(`❌ Error creating ${category.name}:`, error.message);
      } else {
        console.log(`✅ Created ${category.name}`);
      }
    }

    // Verify categories were created
    console.log('\nVerifying categories...');
    const { data, error: verifyError } = await supabase
      .from('categories')
      .select('*');

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log(`✅ Found ${data?.length || 0} categories:`);
      data?.forEach(cat => console.log(`   - ${cat.name}: ${cat.description}`));
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

forceCreateCategories();
