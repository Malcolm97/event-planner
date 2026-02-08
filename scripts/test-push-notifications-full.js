#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkVAPIDKeys() {
  log('\n=== Checking VAPID Keys ===', 'cyan');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log('✗ .env.local file not found', 'red');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasVapidPublic = envContent.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY=');
  const hasVapidPrivate = envContent.includes('VAPID_PRIVATE_KEY=');
  const hasVapidSubject = envContent.includes('VAPID_SUBJECT=');

  if (!hasVapidPublic) {
    log('✗ NEXT_PUBLIC_VAPID_PUBLIC_KEY not found in .env.local', 'red');
  } else {
    log('✓ NEXT_PUBLIC_VAPID_PUBLIC_KEY configured', 'green');
  }

  if (!hasVapidPrivate) {
    log('✗ VAPID_PRIVATE_KEY not found in .env.local', 'red');
  } else {
    log('✓ VAPID_PRIVATE_KEY configured', 'green');
  }

  if (!hasVapidSubject) {
    log('✗ VAPID_SUBJECT not found in .env.local', 'red');
  } else {
    log('✓ VAPID_SUBJECT configured', 'green');
  }

  return hasVapidPublic && hasVapidPrivate && hasVapidSubject;
}

function checkServiceWorker() {
  log('\n=== Checking Service Worker ===', 'cyan');
  
  const swPath = path.join(process.cwd(), 'public/service-worker.js');
  if (!fs.existsSync(swPath)) {
    log('✗ Service worker file not found', 'red');
    return false;
  }

  const swContent = fs.readFileSync(swPath, 'utf8');
  const hasPushListener = swContent.includes("addEventListener('push'");
  const hasNotificationListener = swContent.includes("addEventListener('notificationclick'");

  if (!hasPushListener) {
    log('✗ Push event listener not found in service worker', 'red');
  } else {
    log('✓ Push event listener configured', 'green');
  }

  if (!hasNotificationListener) {
    log('✗ Notification click listener not found in service worker', 'red');
  } else {
    log('✓ Notification click listener configured', 'green');
  }

  return hasPushListener && hasNotificationListener;
}

function checkAPIRoutes() {
  log('\n=== Checking API Routes ===', 'cyan');
  
  const routes = [
    'src/app/api/notifications/subscribe/route.ts',
    'src/app/api/notifications/unsubscribe/route.ts',
    'src/app/api/notifications/send/route.ts',
  ];

  let allExist = true;
  for (const route of routes) {
    const routePath = path.join(process.cwd(), route);
    if (!fs.existsSync(routePath)) {
      log(`✗ ${route} not found`, 'red');
      allExist = false;
    } else {
      log(`✓ ${route} exists`, 'green');
    }
  }

  return allExist;
}

function checkManifest() {
  log('\n=== Checking Web Manifest ===', 'cyan');
  
  const manifestPath = path.join(process.cwd(), 'public/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    log('✗ Manifest file not found', 'red');
    return false;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    let allPresent = true;

    for (const field of requiredFields) {
      if (!manifest[field]) {
        log(`✗ ${field} not found in manifest`, 'red');
        allPresent = false;
      } else {
        log(`✓ ${field} configured in manifest`, 'green');
      }
    }

    return allPresent;
  } catch (error) {
    log(`✗ Error parsing manifest: ${error.message}`, 'red');
    return false;
  }
}

function checkPackageJson() {
  log('\n=== Checking Package Dependencies ===', 'cyan');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = ['web-push'];
    let allPresent = true;

    for (const dep of requiredDeps) {
      if (!pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]) {
        log(`⚠ ${dep} not found in dependencies`, 'yellow');
        allPresent = false;
      } else {
        log(`✓ ${dep} is installed`, 'green');
      }
    }

    return allPresent;
  } catch (error) {
    log(`✗ Error reading package.json: ${error.message}`, 'red');
    return false;
  }
}

function checkHookConfiguration() {
  log('\n=== Checking usePushNotifications Hook ===', 'cyan');
  
  const hookPath = path.join(process.cwd(), 'src/hooks/usePushNotifications.ts');
  if (!fs.existsSync(hookPath)) {
    log('✗ usePushNotifications hook not found', 'red');
    return false;
  }

  const hookContent = fs.readFileSync(hookPath, 'utf8');
  const checks = {
    'subscribe function': hookContent.includes('const subscribe'),
    'unsubscribe function': hookContent.includes('const unsubscribe'),
    'service worker registration': hookContent.includes('registerServiceWorker'),
    'push permission request': hookContent.includes('Notification.requestPermission'),
    'VAPID key usage': hookContent.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY'),
  };

  let allPresent = true;
  for (const [check, present] of Object.entries(checks)) {
    if (!present) {
      log(`✗ ${check} not found in hook`, 'red');
      allPresent = false;
    } else {
      log(`✓ ${check} configured`, 'green');
    }
  }

  return allPresent;
}

function runChecks() {
  log('\n████████████████████████████████████████', 'blue');
  log('  Push Notifications Configuration Check  ', 'blue');
  log('████████████████████████████████████████\n', 'blue');

  const checks = [
    { name: 'VAPID Keys', fn: checkVAPIDKeys },
    { name: 'Service Worker', fn: checkServiceWorker },
    { name: 'API Routes', fn: checkAPIRoutes },
    { name: 'Web Manifest', fn: checkManifest },
    { name: 'Package Dependencies', fn: checkPackageJson },
    { name: 'Push Notifications Hook', fn: checkHookConfiguration },
  ];

  let passed = 0;
  let total = checks.length;

  for (const check of checks) {
    try {
      if (check.fn()) {
        passed++;
      }
    } catch (error) {
      log(`Error during ${check.name} check: ${error.message}`, 'red');
    }
  }

  log('\n████████████████████████████████████████', 'blue');
  log(`Results: ${passed}/${total} checks passed`, passed === total ? 'green' : 'yellow');
  log('████████████████████████████████████████\n', 'blue');

  if (passed === total) {
    log('✓ Push notifications are properly configured!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Install dependencies: npm install', 'yellow');
    log('2. Start the dev server: npm run dev', 'yellow');
    log('3. Test the push notification flow in your browser', 'yellow');
    process.exit(0);
  } else {
    log('✗ Some configuration issues were found. Please review above.', 'red');
    process.exit(1);
  }
}

// Run the checks
runChecks();