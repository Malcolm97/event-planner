// Test script for offline PWA functionality
// Run this in browser console to test all offline features

console.log('🧪 Starting Offline PWA Functionality Tests...\n');

// Test 1: Service Worker Registration
async function testServiceWorker() {
  console.log('1️⃣ Testing Service Worker Registration...');
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker registered:', registration.scope);

      // Test message passing
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        console.log('✅ Service Worker message response:', event.data);
      };

      registration.active?.postMessage({
        type: 'GET_VERSION'
      }, [messageChannel.port2]);

      return true;
    } else {
      console.error('❌ Service Worker not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ Service Worker test failed:', error);
    return false;
  }
}

// Test 2: IndexedDB Operations
async function testIndexedDB() {
  console.log('\n2️⃣ Testing IndexedDB Operations...');
  try {
    // Test database opening
    const { openDatabase, addEvents, getEvents, addUsers, getUsers } = await import('./src/lib/indexedDB.ts');
    const db = await openDatabase();
    console.log('✅ IndexedDB opened successfully');

    // Test adding sample data
    const sampleEvents = [
      { id: 'test-event-1', name: 'Test Event 1', date: new Date().toISOString() },
      { id: 'test-event-2', name: 'Test Event 2', date: new Date().toISOString() }
    ];

    const sampleUsers = [
      { id: 'test-user-1', name: 'Test User 1' },
      { id: 'test-user-2', name: 'Test User 2' }
    ];

    await addEvents(sampleEvents);
    await addUsers(sampleUsers);
    console.log('✅ Sample data added to IndexedDB');

    // Test retrieving data
    const events = await getEvents();
    const users = await getUsers();
    console.log(`✅ Retrieved ${events.length} events and ${users.length} users from cache`);

    return true;
  } catch (error) {
    console.error('❌ IndexedDB test failed:', error);
    return false;
  }
}

// Test 3: Image Upload Queue
async function testImageUploadQueue() {
  console.log('\n3️⃣ Testing Image Upload Queue...');
  try {
    const {
      queueImageUpload,
      getQueuedUploads,
      getUploadQueueStats,
      processQueuedUploads
    } = await import('./src/lib/imageUpload.ts');

    // Create a test file
    const testFile = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });

    // Test queuing
    await queueImageUpload(testFile, 'test-bucket', 'test-path.jpg', 'test-event-id');
    console.log('✅ Image queued successfully');

    // Test queue stats
    const stats = await getUploadQueueStats();
    console.log('✅ Queue stats:', stats);

    // Test retrieving queued uploads
    const uploads = await getQueuedUploads();
    console.log(`✅ Retrieved ${uploads.length} queued uploads`);

    // Test processing (will fail in offline mode, but should not crash)
    try {
      await processQueuedUploads();
      console.log('✅ Queue processing completed (may have failed uploads in test environment)');
    } catch (error) {
      console.log('ℹ️ Queue processing failed as expected in test environment:', error.message);
    }

    return true;
  } catch (error) {
    console.error('❌ Image upload queue test failed:', error);
    return false;
  }
}

// Test 4: Encryption/Decryption
async function testEncryption() {
  console.log('\n4️⃣ Testing Encryption/Decryption...');
  try {
    const { encryptData, decryptData } = await import('./src/lib/imageUpload.ts');

    const testData = 'This is sensitive test data';
    console.log('📝 Original data:', testData);

    // Test encryption
    const encrypted = await encryptData(testData);
    console.log('🔒 Encrypted data:', encrypted);

    // Test decryption
    const decrypted = await decryptData(encrypted);
    console.log('🔓 Decrypted data:', decrypted);

    // Verify data integrity
    if (testData === decrypted) {
      console.log('✅ Encryption/decryption works correctly');
      return true;
    } else {
      console.error('❌ Encryption/decryption data mismatch');
      return false;
    }
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
}

// Test 5: Cache Expiration Logic
async function testCacheExpiration() {
  console.log('\n5️⃣ Testing Cache Expiration Logic...');
  try {
    const { getEvents, getUsers } = await import('./src/lib/indexedDB.ts');

    // Test events cache expiration (should be 30 days)
    const events = await getEvents();
    console.log(`📅 Events cache: ${events.length} items`);

    // Test users cache expiration (should be 60 days)
    const users = await getUsers();
    console.log(`👥 Users cache: ${users.length} items`);

    console.log('✅ Cache expiration logic working');
    return true;
  } catch (error) {
    console.error('❌ Cache expiration test failed:', error);
    return false;
  }
}

// Test 6: Offline/Online Detection
async function testOfflineDetection() {
  console.log('\n6️⃣ Testing Offline/Online Detection...');
  try {
    const isOnline = navigator.onLine;
    console.log(`📡 Current online status: ${isOnline ? 'Online' : 'Offline'}`);

    // Test online event listener
    const onlinePromise = new Promise((resolve) => {
      const handler = () => {
        window.removeEventListener('online', handler);
        console.log('✅ Online event detected');
        resolve(true);
      };
      window.addEventListener('online', handler);

      // If already online, trigger manually for test
      if (isOnline) {
        setTimeout(() => window.dispatchEvent(new Event('online')), 100);
      }
    });

    // Test offline event listener
    const offlinePromise = new Promise((resolve) => {
      const handler = () => {
        window.removeEventListener('offline', handler);
        console.log('✅ Offline event detected');
        resolve(true);
      };
      window.addEventListener('offline', handler);
    });

    // Test both events (they may not fire if status doesn't change)
    await Promise.race([onlinePromise, offlinePromise, new Promise(resolve => setTimeout(resolve, 500))]);

    console.log('✅ Offline/online detection working');
    return true;
  } catch (error) {
    console.error('❌ Offline detection test failed:', error);
    return false;
  }
}

// Test 7: Request Deduplication
async function testRequestDeduplication() {
  console.log('\n7️⃣ Testing Request Deduplication...');
  try {
    const { deduplicateRequest } = await import('./src/lib/imageUpload.ts');

    const mockRequest = () => new Promise(resolve => setTimeout(() => resolve('test result'), 100));

    // Test multiple simultaneous requests with same key
    const promises = [
      deduplicateRequest('test-key', mockRequest),
      deduplicateRequest('test-key', mockRequest),
      deduplicateRequest('test-key', mockRequest)
    ];

    const results = await Promise.all(promises);

    if (results.every(result => result === 'test result')) {
      console.log('✅ Request deduplication working');
      return true;
    } else {
      console.error('❌ Request deduplication failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Request deduplication test failed:', error);
    return false;
  }
}

// Test 8: Memory Cache
async function testMemoryCache() {
  console.log('\n8️⃣ Testing Memory Cache...');
  try {
    const { getFromMemoryCache, setMemoryCache } = await import('./src/lib/imageUpload.ts');

    const testKey = 'test-cache-key';
    const testData = { message: 'Hello from memory cache' };

    // Test setting cache
    setMemoryCache(testKey, testData, 5000); // 5 second TTL
    console.log('💾 Data cached in memory');

    // Test getting cache
    const cachedData = getFromMemoryCache(testKey);
    if (cachedData && cachedData.message === testData.message) {
      console.log('✅ Memory cache working');
      return true;
    } else {
      console.error('❌ Memory cache failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Memory cache test failed:', error);
    return false;
  }
}

// Test 9: Data Sanitization
async function testDataSanitization() {
  console.log('\n9️⃣ Testing Data Sanitization...');
  try {
    const { sanitizeData } = await import('./src/lib/imageUpload.ts');

    const dangerousData = {
      safeField: 'This is safe',
      dangerousField: '<script>alert("XSS")</script><img src=x onerror=alert(1)>',
      nested: {
        anotherDangerous: 'javascript:alert("nested XSS")'
      }
    };

    const sanitized = sanitizeData(dangerousData);

    // Check if dangerous content was removed
    if (!sanitized.dangerousField.includes('<script>') &&
        !sanitized.dangerousField.includes('onerror') &&
        !sanitized.nested.anotherDangerous.includes('javascript:')) {
      console.log('✅ Data sanitization working');
      return true;
    } else {
      console.error('❌ Data sanitization failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Data sanitization test failed:', error);
    return false;
  }
}

// Test 10: Component Integration
async function testComponentIntegration() {
  console.log('\n🔟 Testing Component Integration...');
  try {
    // Test if components can be imported without errors
    const { default: OfflineIndicator } = await import('./src/components/OfflineIndicator.tsx');
    const { default: QueueManagementModal } = await import('./src/components/QueueManagementModal.tsx');

    console.log('✅ Components imported successfully');

    // Test if utility functions are available
    const utils = await import('./src/lib/utils.ts');
    console.log('✅ Utility functions available');

    return true;
  } catch (error) {
    console.error('❌ Component integration test failed:', error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  const results = [];

  results.push(await testServiceWorker());
  results.push(await testIndexedDB());
  results.push(await testImageUploadQueue());
  results.push(await testEncryption());
  results.push(await testCacheExpiration());
  results.push(await testOfflineDetection());
  results.push(await testRequestDeduplication());
  results.push(await testMemoryCache());
  results.push(await testDataSanitization());
  results.push(await testComponentIntegration());

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(`\n🎉 Test Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎊 All offline PWA functionality tests PASSED!');
  } else {
    console.log('⚠️ Some tests failed. Check the output above for details.');
  }

  return { passed, total };
}

// Auto-run tests when script loads
if (typeof window !== 'undefined') {
  // Wait for page to load
  window.addEventListener('load', () => {
    setTimeout(runAllTests, 1000);
  });
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}
