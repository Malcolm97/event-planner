#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * 
 * This script tests the Supabase connection and provides detailed diagnostics
 * to help identify and fix connection issues.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local (Next.js convention)
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

// Test 1: Environment Variables
console.log('📋 Environment Variable Check:');
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Environment variables are not properly set!');
  console.log('Please ensure your .env.local file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

// Test 2: URL Format Validation
console.log('\n🌐 URL Format Check:');
if (supabaseUrl.includes('your-project-id') || supabaseUrl.includes('your-anon-key')) {
  console.log('❌ Supabase URL contains placeholder values!');
  console.log('Please replace with your actual Supabase project URL.');
  process.exit(1);
}

if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
  console.log('❌ Invalid Supabase URL format!');
  console.log('URL should be in format: https://your-project-id.supabase.co');
  process.exit(1);
}

console.log('  ✅ URL format is valid');

// Test 3: Create Supabase Client
console.log('\n🏗️  Creating Supabase Client...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('  ✅ Supabase client created successfully');

// Test 4: Test Database Connection
async function testDatabaseConnection() {
  console.log('\n🗄️  Testing Database Connection...');
  
  try {
    // Test with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`  ❌ Database connection failed: ${error.message}`);
      
      // Provide specific error guidance
      if (error.code === 'PGRST116') {
        console.log('  🔧 Issue: Table not found. You may need to:');
        console.log('     1. Create the required tables in your Supabase database');
        console.log('     2. Run the database schema setup SQL');
        console.log('     3. Ensure RLS policies are properly configured');
      } else if (error.code === '42501') {
        console.log('  🔧 Issue: Permission denied. You may need to:');
        console.log('     1. Check Row Level Security policies');
        console.log('     2. Ensure the anon key has proper permissions');
        console.log('     3. Run the RLS policy fixes');
      } else if (error.message.includes('infinite recursion')) {
        console.log('  🔧 Issue: RLS policy infinite recursion detected!');
        console.log('     1. Run the RLS policy fix in your Supabase SQL Editor');
        console.log('     2. Use the fix-rls-policies.sql file provided');
      }
      
      return false;
    }

    console.log('  ✅ Database connection successful');
    console.log(`  📊 Found ${data ? data.length : 0} users in database`);
    return true;

  } catch (error) {
    console.log(`  ❌ Connection test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Test Authentication
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log(`  ❌ Authentication failed: ${error.message}`);
      return false;
    }

    if (data.user) {
      console.log(`  ✅ User authenticated: ${data.user.email}`);
    } else {
      console.log('  ⚠️  No user currently authenticated (this is normal)');
    }
    
    return true;

  } catch (error) {
    console.log(`  ❌ Authentication test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Check Required Tables
async function checkRequiredTables() {
  console.log('\n📋 Checking Required Tables...');
  
  const requiredTables = ['users', 'events', 'activities', 'saved_events'];
  const existingTables = [];
  const missingTables = [];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === 'PGRST116') {
        missingTables.push(table);
      } else {
        existingTables.push(table);
      }
    } catch (error) {
      missingTables.push(table);
    }
  }

  if (existingTables.length > 0) {
    console.log(`  ✅ Existing tables: ${existingTables.join(', ')}`);
  }

  if (missingTables.length > 0) {
    console.log(`  ❌ Missing tables: ${missingTables.join(', ')}`);
    console.log('  🔧 To fix this, you need to:');
    console.log('     1. Go to your Supabase dashboard');
    console.log('     2. Navigate to SQL Editor');
    console.log('     3. Run the database schema setup SQL');
    console.log('     4. Ensure all required tables are created');
  }

  return missingTables.length === 0;
}

// Main execution
async function runTests() {
  const dbConnected = await testDatabaseConnection();
  const authWorking = await testAuthentication();
  const tablesExist = await checkRequiredTables();

  console.log('\n📊 Test Summary:');
  console.log(`  Database Connection: ${dbConnected ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Authentication: ${authWorking ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Required Tables: ${tablesExist ? '✅ PASS' : '❌ FAIL'}`);

  if (dbConnected && authWorking && tablesExist) {
    console.log('\n🎉 All tests passed! Supabase is properly configured.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above and take corrective action.');
  }

  console.log('\n💡 Additional Resources:');
  console.log('  - Supabase Dashboard: https://app.supabase.com');
  console.log('  - Database Schema: Check database/schemas/ directory');
  console.log('  - RLS Policies: Run fix-rls-policies.sql if needed');
}

// Run the tests
runTests().catch(console.error);
