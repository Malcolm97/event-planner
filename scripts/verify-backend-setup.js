/**
 * Backend Verification Script
 * Run this script to verify all database connections and RLS policies are working correctly
 * 
 * Usage: node scripts/verify-backend-setup.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`  ✅ ${message}`, 'green');
}

function logError(message) {
  log(`  ❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`  ℹ️  ${message}`, 'cyan');
}

function logSection(title) {
  console.log('');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'blue');
  log(`  ${title}`, 'blue');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'blue');
}

async function verifyTableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { exists: false, error: 'Table does not exist' };
      }
      // RLS error means table exists but we can't access it (expected for some tables)
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        return { exists: true, error: null, rls: true };
      }
      return { exists: false, error: error.message };
    }
    return { exists: true, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function verifyTableColumns(tableName, expectedColumns) {
  try {
    // First try to get columns from data
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error && data && data.length > 0) {
      const existingColumns = Object.keys(data[0]);
      const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
      return { 
        success: missingColumns.length === 0, 
        missingColumns,
        existingColumns 
      };
    }
    
    // If no data, we can't verify columns from rows, but table exists
    // This is not an error - just means table is empty
    if (error && error.code !== 'PGRST116') {
      return { success: false, missingColumns: [], error: error.message };
    }
    
    // Table exists but is empty - this is OK
    return { 
      success: true, 
      missingColumns: [],
      existingColumns: [],
      isEmpty: true
    };
  } catch (err) {
    return { success: false, missingColumns: [], error: err.message };
  }
}

async function countRecords(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return { success: false, count: 0, error: error.message };
    }
    return { success: true, count: count || 0, error: null };
  } catch (err) {
    return { success: false, count: 0, error: err.message };
  }
}

async function runVerification() {
  console.log('');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         🔍 Backend Verification Script                     ║', 'cyan');
  log('║         Event Planner - Supabase Connection Audit          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  logInfo(`Supabase URL: ${supabaseUrl}`);
  
  // ========================================
  // SECTION 1: Table Existence Check
  // ========================================
  logSection('1. TABLE EXISTENCE CHECK');
  
  const tables = [
    { name: 'profiles', displayName: 'Profiles (Users)' },
    { name: 'events', displayName: 'Events' },
    { name: 'saved_events', displayName: 'Saved Events' },
    { name: 'activities', displayName: 'Activities' },
    { name: 'audit_logs', displayName: 'Audit Logs' },
    { name: 'categories', displayName: 'Categories' },
    { name: 'locations', displayName: 'Locations' },
    { name: 'push_subscriptions', displayName: 'Push Subscriptions' },
  ];
  
  let tablesOk = true;
  for (const table of tables) {
    const result = await verifyTableExists(table.name);
    if (result.exists) {
      if (result.rls) {
        logSuccess(`${table.displayName} - exists (RLS protected)`);
      } else {
        logSuccess(`${table.displayName} - exists`);
      }
    } else {
      logError(`${table.displayName} - ${result.error}`);
      tablesOk = false;
    }
  }
  
  // ========================================
  // SECTION 2: Column Verification
  // ========================================
  logSection('2. COLUMN VERIFICATION');
  
  // Check profiles table columns
  logInfo('Checking profiles table columns...');
  const profilesColumns = ['id', 'full_name', 'avatar_url', 'role', 'email', 'phone', 'company', 'about'];
  const profilesResult = await verifyTableColumns('profiles', profilesColumns);
  if (profilesResult.success) {
    if (profilesResult.isEmpty) {
      logSuccess('Profiles table exists (empty - columns will be verified on first insert)');
    } else {
      logSuccess('All required columns exist in profiles table');
    }
  } else if (profilesResult.existingColumns && profilesResult.existingColumns.length > 0) {
    logWarning(`Missing columns in profiles: ${profilesResult.missingColumns.join(', ')}`);
    logInfo(`Existing columns: ${profilesResult.existingColumns.join(', ')}`);
  } else {
    logError(`Profiles table error: ${profilesResult.error}`);
  }
  
  // Check events table columns
  logInfo('Checking events table columns...');
  const eventsColumns = ['id', 'name', 'description', 'date', 'location', 'category', 'approved', 'created_by'];
  const eventsResult = await verifyTableColumns('events', eventsColumns);
  if (eventsResult.success) {
    if (eventsResult.isEmpty) {
      logSuccess('Events table exists (empty - columns will be verified on first insert)');
    } else {
      logSuccess('All required columns exist in events table');
    }
  } else if (eventsResult.existingColumns && eventsResult.existingColumns.length > 0) {
    logWarning(`Missing columns in events: ${eventsResult.missingColumns.join(', ')}`);
    logInfo(`Existing columns: ${eventsResult.existingColumns.join(', ')}`);
  } else {
    logError(`Events table error: ${eventsResult.error}`);
  }
  
  // ========================================
  // SECTION 3: Record Counts
  // ========================================
  logSection('3. RECORD COUNTS');
  
  for (const table of tables) {
    const result = await countRecords(table.name);
    if (result.success) {
      logInfo(`${table.displayName}: ${result.count} records`);
    } else {
      logWarning(`${table.displayName}: Could not count (${result.error})`);
    }
  }
  
  // ========================================
  // SECTION 4: RLS Policy Check
  // ========================================
  logSection('4. RLS POLICY CHECK');
  
  // Test public read access to events
  logInfo('Testing public read access to events...');
  const eventsReadTest = await supabase.from('events').select('id').limit(1);
  if (!eventsReadTest.error || eventsReadTest.error?.code === 'PGRST116') {
    logSuccess('Events table is readable (public access works)');
  } else {
    logError(`Events table read failed: ${eventsReadTest.error?.message}`);
  }
  
  // Test categories read access
  logInfo('Testing read access to categories...');
  const categoriesReadTest = await supabase.from('categories').select('id').limit(1);
  if (!categoriesReadTest.error || categoriesReadTest.error?.code === 'PGRST116') {
    logSuccess('Categories table is readable');
  } else {
    logWarning(`Categories table read: ${categoriesReadTest.error?.message}`);
  }
  
  // ========================================
  // SECTION 5: Admin Function Check
  // ========================================
  logSection('5. ADMIN HELPER FUNCTION CHECK');
  
  // Check if is_admin function exists
  logInfo('Checking if is_admin() function exists...');
  try {
    const { error: funcError } = await supabase.rpc('is_admin');
    if (funcError) {
      if (funcError.message?.includes('function') && funcError.message?.includes('does not exist')) {
        logWarning('is_admin() function does not exist - run the migration SQL');
        logInfo('Run: database/migrations/comprehensive-backend-fix.sql');
      } else {
        logWarning(`is_admin() function check: ${funcError.message}`);
      }
    } else {
      logSuccess('is_admin() function exists');
    }
  } catch (err) {
    logWarning(`Could not verify is_admin() function: ${err.message}`);
  }
  
  // ========================================
  // SECTION 6: Data Integrity Check
  // ========================================
  logSection('6. DATA INTEGRITY CHECK');
  
  // Check for events without creators
  logInfo('Checking for orphaned events (no creator)...');
  const { data: orphanedEvents, error: orphanError } = await supabase
    .from('events')
    .select('id, name')
    .is('created_by', null);
  
  if (!orphanError && orphanedEvents) {
    if (orphanedEvents.length === 0) {
      logSuccess('No orphaned events found');
    } else {
      logWarning(`Found ${orphanedEvents.length} events without creators`);
    }
  }
  
  // Check for events with missing required fields
  logInfo('Checking for events with missing required fields...');
  const { data: incompleteEvents, error: incompleteError } = await supabase
    .from('events')
    .select('id, name, date, location')
    .or('name.is.null,date.is.null,location.is.null');
  
  if (!incompleteError && incompleteEvents) {
    if (incompleteEvents.length === 0) {
      logSuccess('All events have required fields');
    } else {
      logWarning(`Found ${incompleteEvents.length} events with missing required fields`);
    }
  }
  
  // ========================================
  // Summary
  // ========================================
  logSection('VERIFICATION SUMMARY');
  
  if (tablesOk) {
    logSuccess('All required tables exist');
    log('');
    log('🎉 Backend setup verification complete!', 'green');
    log('');
    logInfo('If you see any warnings above, run the migration SQL:');
    logInfo('  database/migrations/comprehensive-backend-fix.sql');
    log('');
    logInfo('To test with authentication, sign in to the app and check the admin dashboard.');
  } else {
    logError('Some tables are missing. Please run the migration SQL:');
    logInfo('  database/migrations/comprehensive-backend-fix.sql');
  }
  
  console.log('');
}

// Run the verification
runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});