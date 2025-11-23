#!/usr/bin/env node

/**
 * Create Admin User Script
 * Run this script to create a test admin user for the admin dashboard
 *
 * Usage: node create-admin-user.js
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

async function createAdminUser() {
  console.log('👤 Creating test admin user...\n');

  const adminEmail = 'admin@test.com';
  const adminPassword = 'admin123';

  try {
    // Check if admin user already exists
    console.log('⏳ Checking if admin user already exists...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.log('⚠️  Could not check existing users (this is normal for anon key)');
      console.log('Continuing with user creation...\n');
    } else {
      const existingAdmin = existingUsers.users.find(user => user.email === adminEmail);
      if (existingAdmin) {
        console.log('✅ Admin user already exists!');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log('\nYou can now log in to the admin dashboard at: http://localhost:3000/admin/login');
        return;
      }
    }

    // Create admin user
    console.log('⏳ Creating admin user...');
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      console.error('❌ Failed to create admin user:', error.message);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);

    // Wait a moment for the user to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update the profile to set admin role
    if (data.user) {
      console.log('⏳ Setting admin role...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: 'Admin User',
          role: 'admin'
        });

      if (profileError) {
        console.error('❌ Failed to set admin role:', profileError.message);
        console.log('You may need to manually set the role in the Supabase dashboard');
      } else {
        console.log('✅ Admin role set successfully!');
      }
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('\nNext steps:');
    console.log('1. Go to: http://localhost:3000/admin/login');
    console.log('2. Log in with the credentials above');
    console.log('3. You should be redirected to the admin dashboard');
    console.log('4. The dashboard should load data from Supabase');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createAdminUser().catch(console.error);
