// Test script to verify activities table and database connection
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Supabase Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('activities')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function testActivitiesTable() {
  console.log('🔍 Testing activities table...');

  try {
    // Try to select from activities table
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Activities table test failed:', error.message);
      console.error('Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        console.error('💡 The activities table does not exist. Please run the create_activities_table.sql script in your Supabase database.');
        console.error('💡 You can run this by going to your Supabase dashboard > SQL Editor and executing the contents of create_activities_table.sql');
      } else if (error.code === '42501') {
        console.error('💡 Permission denied. Please check Row Level Security policies.');
      }

      return false;
    }

    console.log('✅ Activities table test successful');
    console.log('📊 Current activities count:', data?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Activities table test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting database tests...\n');

  const connectionTest = await testDatabaseConnection();
  console.log('');

  if (connectionTest) {
    const tableTest = await testActivitiesTable();
    console.log('');

    if (tableTest) {
      console.log('🎉 All tests passed! Your database is ready.');
    } else {
      console.log('⚠️ Some tests failed. Please check the errors above.');
    }
  } else {
    console.log('❌ Database connection failed. Please check your configuration.');
  }

  process.exit(0);
}

runTests();
