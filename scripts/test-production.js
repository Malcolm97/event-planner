#!/usr/bin/env node

/**
 * Production Deployment Test Script
 * Tests the live PNG Events application
 *
 * Usage: node test-production.js
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://png-events.malcolmsioni.com';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testEndpoint(name, url, expectedStatus = 200) {
  console.log(`🔍 Testing: ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await makeRequest(url);

    if (response.status === expectedStatus) {
      console.log(`   ✅ Status: ${response.status} (Expected: ${expectedStatus})`);
      return { success: true, response };
    } else {
      console.log(`   ❌ Status: ${response.status} (Expected: ${expectedStatus})`);
      return { success: false, response };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error };
  }
}

async function runProductionTests() {
  console.log('🚀 Testing PNG Events Production Deployment\n');
  console.log(`🌐 Production URL: ${PRODUCTION_URL}\n`);

  const tests = [
    // Basic functionality tests
    { name: 'Homepage loads', url: PRODUCTION_URL, expectedStatus: 200 },
    { name: 'Events page', url: `${PRODUCTION_URL}/events`, expectedStatus: 200 },
    { name: 'Categories page', url: `${PRODUCTION_URL}/categories`, expectedStatus: 200 },
    { name: 'About page', url: `${PRODUCTION_URL}/about`, expectedStatus: 200 },
    { name: 'Sign in page', url: `${PRODUCTION_URL}/signin`, expectedStatus: 200 },

    // API endpoints
    { name: 'Health check API', url: `${PRODUCTION_URL}/api/health`, expectedStatus: 200 },
    { name: 'Events API', url: `${PRODUCTION_URL}/api/events`, expectedStatus: 200 },

    // Static assets
    { name: 'Manifest.json', url: `${PRODUCTION_URL}/manifest.json`, expectedStatus: 200 },
    { name: 'Service worker', url: `${PRODUCTION_URL}/service-worker.js`, expectedStatus: 200 },
    { name: 'Offline page', url: `${PRODUCTION_URL}/offline.html`, expectedStatus: 200 },

    // Icons and assets
    { name: 'PWA Icon', url: `${PRODUCTION_URL}/icons/icon-192x192.png`, expectedStatus: 200 },
    { name: 'Favicon', url: `${PRODUCTION_URL}/favicon.ico`, expectedStatus: 200 },
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, test.expectedStatus);
    results.push({ ...test, ...result });

    if (result.success) {
      passed++;
    } else {
      failed++;
    }

    console.log(''); // Empty line between tests
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All production tests passed! Your app is live and working.');
    console.log('\nNext steps:');
    console.log('1. Test user authentication manually');
    console.log('2. Test PWA installation on mobile');
    console.log('3. Run Lighthouse performance test');
    console.log('4. Test offline functionality');
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
    console.log('\nCommon solutions:');
    console.log('1. Verify environment variables in Vercel');
    console.log('2. Check Vercel deployment logs');
    console.log('3. Ensure database is accessible');
    console.log('4. Verify static assets are built correctly');

    console.log('\nFailed tests:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.name}: ${result.error?.message || 'Status ' + result.response?.status}`);
    });
  }

  console.log(`\n🔗 Live Application: ${PRODUCTION_URL}`);
  console.log('📱 Test PWA: Open on mobile device');
  console.log('⚡ Performance: Run Lighthouse audit');
}

// Performance test using a simple approximation
async function testPerformance() {
  console.log('\n⚡ Testing basic performance...');

  try {
    const start = Date.now();
    const response = await makeRequest(PRODUCTION_URL);
    const loadTime = Date.now() - start;

    console.log(`   Page load time: ${loadTime}ms`);

    if (loadTime < 3000) {
      console.log('   ✅ Load time acceptable (< 3 seconds)');
    } else {
      console.log('   ⚠️  Load time slow (> 3 seconds)');
    }

    // Check content size
    const contentSize = response.data.length;
    console.log(`   Content size: ${(contentSize / 1024).toFixed(1)} KB`);

    if (contentSize > 0) {
      console.log('   ✅ Content received');
    } else {
      console.log('   ❌ No content received');
    }

  } catch (error) {
    console.log(`   ❌ Performance test failed: ${error.message}`);
  }
}

async function main() {
  try {
    await runProductionTests();
    await testPerformance();
  } catch (error) {
    console.error('❌ Test script failed:', error.message);
    process.exit(1);
  }
}

main();
