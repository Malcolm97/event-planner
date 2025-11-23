#!/usr/bin/env node

/**
 * Database Setup Verification Script
 * Run this script to verify all database migrations are applied correctly
 *
 * Usage: node verify-database-setup.js
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

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying PNG Events Database Setup...\n');

  const checks = [
    {
      name: 'Events table exists',
      query: () => supabase.from('events').select('count', { count: 'exact', head: true })
    },
    {
      name: 'Profiles table exists',
      query: () => supabase.from('profiles').select('count', { count: 'exact', head: true })
    },
    {
      name: 'Saved events table exists',
      query: () => supabase.from('saved_events').select('count', { count: 'exact', head: true })
    },
    {
      name: 'Activities table exists',
      query: () => supabase.from('activities').select('count', { count: 'exact', head: true })
    },
    {
      name: 'Events table has end_date column',
      query: async () => {
        const { data, error } = await supabase
          .from('events')
          .select('end_date')
          .limit(1);
        return { data, error };
      }
    },
    {
      name: 'Users table has contact columns',
      query: async () => {
        const { data, error } = await supabase
          .from('users')
          .select('contact_method, whatsapp_number, contact_visibility')
          .limit(1);
        return { data, error };
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      console.log(`⏳ Checking: ${check.name}`);
      const result = await check.query();

      if (result.error) {
        console.log(`❌ ${check.name}: FAILED`);
        console.log(`   Error: ${result.error.message}\n`);
        failed++;
      } else {
        console.log(`✅ ${check.name}: PASSED\n`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${check.name}: FAILED`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log('📊 Verification Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All database checks passed! Your database is ready for production.');
    console.log('\nNext steps:');
    console.log('1. Set up production environment variables in Vercel');
    console.log('2. Deploy to Vercel staging environment');
    console.log('3. Test PWA functionality');
  } else {
    console.log('\n⚠️  Some database checks failed. Please run the migration SQL files in order:');
    console.log('1. complete-schema-setup.sql');
    console.log('2. supabase-rls-setup.sql');
    console.log('3. add_end_date_migration.sql');
    console.log('4. user_contact_migration.sql');
    console.log('5. create_activities_table.sql');
    console.log('6. recent_activities_dashboard.sql');
  }

  console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard');
}

verifyDatabaseSetup().catch(console.error);
