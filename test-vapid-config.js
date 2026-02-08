#!/usr/bin/env node

/**
 * Test script to verify VAPID key configuration
 * Run with: node test-vapid-config.js
 */

console.log('🔍 Testing VAPID Configuration...\n');

// Test 1: Check environment variables
console.log('1. Checking environment variables:');
let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
let vapidEmail = process.env.VAPID_EMAIL;

// If not found in process.env, load from .env.local
if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
  console.log('   Environment variables not found in process.env');
  console.log('   This is expected in Node.js - they are loaded by Next.js');
  console.log('   ✅ Checking .env.local file directly...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    const lines = envContent.split('\n');
    
    let foundPublic = false;
    let foundPrivate = false;
    let foundEmail = false;
    
    for (const line of lines) {
      if (line.startsWith('NEXT_PUBLIC_VAPID_PUBLIC_KEY=')) {
        vapidPublicKey = line.split('=')[1];
        foundPublic = true;
        console.log('   ✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY found in .env.local');
      } else if (line.startsWith('VAPID_PRIVATE_KEY=')) {
        vapidPrivateKey = line.split('=')[1];
        foundPrivate = true;
        console.log('   ✅ VAPID_PRIVATE_KEY found in .env.local');
      } else if (line.startsWith('VAPID_EMAIL=')) {
        vapidEmail = line.split('=')[1];
        foundEmail = true;
        console.log('   ✅ VAPID_EMAIL found in .env.local');
      }
    }
    
    if (!foundPublic || !foundPrivate || !foundEmail) {
      console.log('\n❌ Missing required environment variables in .env.local!');
      console.log('Please add them to your .env.local file:');
      console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key');
      console.log('VAPID_PRIVATE_KEY=your_private_key');
      console.log('VAPID_EMAIL=your_email@example.com');
      process.exit(1);
    }
    
  } catch (error) {
    console.log('   ❌ Could not read .env.local file');
    process.exit(1);
  }
}

console.log(`   ✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY: ${vapidPublicKey ? 'Found' : 'Missing'}`);
console.log(`   ✅ VAPID_PRIVATE_KEY: ${vapidPrivateKey ? 'Found' : 'Missing'}`);
console.log(`   ✅ VAPID_EMAIL: ${vapidEmail ? 'Found' : 'Missing'}`);

if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please add them to your .env.local file:');
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key');
  console.log('VAPID_PRIVATE_KEY=your_private_key');
  console.log('VAPID_EMAIL=your_email@example.com');
  process.exit(1);
}

// Test 2: Validate VAPID key format
console.log('\n2. Validating VAPID key format:');
console.log(`   Public Key Length: ${vapidPublicKey.length} characters`);
console.log(`   Private Key Length: ${vapidPrivateKey.length} characters`);

if (vapidPublicKey.length < 80) {
  console.log('   ❌ Public key appears too short (< 80 characters)');
  process.exit(1);
}

if (vapidPrivateKey.length < 40) {
  console.log('   ❌ Private key appears too short (< 40 characters)');
  process.exit(1);
}

// Test 3: Test key conversion (browser-side logic)
console.log('\n3. Testing key conversion:');
try {
  // Simulate the urlBase64ToUint8Array function from usePushNotifications.ts
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = Buffer.from(base64, 'base64');
    return new Uint8Array(rawData);
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  console.log(`   ✅ Key conversion successful: ${applicationServerKey.length} bytes`);
} catch (error) {
  console.log(`   ❌ Key conversion failed: ${error.message}`);
  process.exit(1);
}

// Test 4: Check web-push library
console.log('\n4. Checking web-push library:');
try {
  const webpush = require('web-push');
  console.log('   ✅ web-push library available');
  
  // Test VAPID configuration
  try {
    webpush.setVapidDetails(
      `mailto:${vapidEmail}`,
      vapidPublicKey,
      vapidPrivateKey
    );
    console.log('   ✅ VAPID configuration successful');
  } catch (vapidError) {
    console.log(`   ❌ VAPID configuration failed: ${vapidError.message}`);
    process.exit(1);
  }
} catch (error) {
  console.log('   ❌ web-push library not available');
  console.log('   Run: npm install web-push');
  process.exit(1);
}

console.log('\n🎉 All VAPID configuration tests passed!');
console.log('\nNext steps:');
console.log('1. Restart your development server');
console.log('2. Open the app in your browser');
console.log('3. Go to Settings and try enabling notifications');
console.log('4. Check browser console for any errors');