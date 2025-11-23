// Test script for push notifications
// Run with: node test-push-notifications.js

const https = require('https');
const webpush = require('web-push');

// Test VAPID keys (replace with your actual keys)
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Generated VAPID Keys for testing:');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('');

// Example subscription object (this would come from the browser)
const exampleSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/example-endpoint',
  keys: {
    p256dh: 'example-p256dh-key',
    auth: 'example-auth-key'
  }
};

console.log('Example subscription object:');
console.log(JSON.stringify(exampleSubscription, null, 2));
console.log('');

// Test notification payload
const testPayload = {
  title: 'Test Notification',
  body: 'This is a test push notification from PNG Events',
  icon: '/icons/icon-192x192.png',
  badge: '/icons/icon-96x96.png',
  data: {
    url: '/test-event',
    eventId: 'test-123'
  }
};

console.log('Example notification payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('');

console.log('To test push notifications:');
console.log('1. Set up your VAPID keys in .env.local:');
console.log('   NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('   VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('   VAPID_EMAIL=your-email@example.com');
console.log('');
console.log('2. Run the database migration: create_push_subscriptions_table.sql');
console.log('3. Start the development server: npm run dev');
console.log('4. Open the app in a browser and install it as PWA');
console.log('5. Go to Settings and enable push notifications');
console.log('6. Create a new event to trigger a push notification');
console.log('');
console.log('Note: For production, use proper VAPID keys and ensure your domain is configured with push services.');
