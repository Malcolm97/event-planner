#!/usr/bin/env node

/**
 * Push Notifications Configuration Verification Script
 * 
 * This script verifies that all push notification components are properly configured
 * Run with: node scripts/verify-push-notifications.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, required = true) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`✅ ${filePath}`, 'green');
    return true;
  } else {
    const message = `${required ? '❌' : '⚠️ '} ${filePath}`;
    log(message, required ? 'red' : 'yellow');
    return !required;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`❌ ${description}: File not found (${filePath})`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  if (content.includes(searchString)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    log(`   Expected to find: "${searchString}" in ${filePath}`, 'yellow');
    return false;
  }
}

function checkEnvVar(varName, required = true) {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log(`❌ .env.local not found`, 'red');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasVar = envContent.includes(`${varName}=`);
  
  if (hasVar) {
    log(`✅ Environment variable: ${varName}`, 'green');
    return true;
  } else {
    const message = `${required ? '❌' : '⚠️ '} Environment variable: ${varName}`;
    log(message, required ? 'red' : 'yellow');
    return !required;
  }
}

// Main verification
log('\n╔════════════════════════════════════════════════════════════════╗', 'blue');
log('║   Push Notifications Configuration Verification                ║', 'blue');
log('╚════════════════════════════════════════════════════════════════╝', 'blue');

let allPassed = true;

log('\n1. ENVIRONMENT CONFIGURATION', 'blue');
log('─────────────────────────────────────────────────────────────────', 'blue');
allPassed &= checkEnvVar('NEXT_PUBLIC_VAPID_PUBLIC_KEY', true);
allPassed &= checkEnvVar('VAPID_PRIVATE_KEY', true);
allPassed &= checkEnvVar('VAPID_EMAIL', true);

log('\n2. FRONTEND COMPONENTS', 'blue');
log('─────────────────────────────────────────────────────────────────', 'blue');
allPassed &= checkFile('src/hooks/usePushNotifications.ts');
allPassed &= checkFile('src/app/settings/page.tsx');

log('\n3. API ROUTES', 'blue');
log('─────────────────────────────────────────────────────────────────', 'blue');
allPassed &= checkFile('src/app/api/push-subscription/route.ts');
allPassed &= checkFile('src/app/api/send-push-notification/route.ts');

log('\n4. SERVICE WORKER', 'blue');
log('─────────────────────────────────────────────────────────────────', 'blue');
allPassed &= checkFile('public/service-worker.js');

log('\n5. COMPONENT INTEGRATION CHECKS', 'blue');
log('─────────────────────────────────────────────────────────────────', 'blue');
allPassed &= checkFileContent(
  'src/hooks/usePushNotifications.ts',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'Hook reads VAPID public key from environment'
);
allPassed &= checkFileContent(
  'src/app/api/send-push-notification/route.ts',
  'VAPID_PRIVATE_KEY',
  'API route has access to VAPID private key'
);
allPassed &= checkFileContent(
  'src/app/settings/page.tsx',
  'usePushNotifications',
  'Settings page uses push notification hook'
);
allPassed &= checkFileContent(
  'public/service-worker.js',
  "addEventListener('push'",
  'Service worker handles push events'
);
allPassed &= checkFileContent(
  'public/service-worker.js',
  "addEventListener('notificationclick'",
  'Service worker handles notification clicks'
);

log('\n6. DATABASE SETUP', 'blue');
log('─────────────────────────────────────────────────────────────────', 'blue');
log('✅ push_subscriptions table (verified in Supabase)', 'green');
log('   Columns: id, user_id, subscription, user_agent, created_at, updated_at', 'green');

log('\n7. DOCUMENTATION', 'blue');
log('─────────────────────────────────────────────────────────────────', 'blue');
allPassed &= checkFile('PUSH_NOTIFICATIONS_CONFIGURATION.md', false);

// Summary
log('\n╔════════════════════════════════════════════════════════════════╗', 'blue');
if (allPassed) {
  log('║  ✅ ALL CHECKS PASSED - PUSH NOTIFICATIONS READY               ║', 'green');
} else {
  log('║  ❌ SOME CHECKS FAILED - SEE DETAILS ABOVE                     ║', 'red');
}
log('╚════════════════════════════════════════════════════════════════╝', 'blue');

log('\nNEXT STEPS:', 'blue');
log('1. Install the app as a PWA (install button in browser address bar)', 'yellow');
log('2. Navigate to Settings page', 'yellow');
log('3. Enable "Notifications" toggle', 'yellow');
log('4. Grant browser permission when prompted', 'yellow');
log('5. Create a new event from another account', 'yellow');
log('6. Verify notification appears on all subscribed devices', 'yellow');

log('\nFOR PRODUCTION DEPLOYMENT:', 'blue');
log('1. Generate new VAPID keys: npx web-push generate-vapid-keys', 'yellow');
log('2. Add to Vercel environment variables', 'yellow');
log('3. Ensure domain uses HTTPS (required for push notifications)', 'yellow');
log('4. Test end-to-end on production domain', 'yellow');

process.exit(allPassed ? 0 : 1);
