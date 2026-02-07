#!/usr/bin/env node

/**
 * Test script to verify PWA icons are working correctly
 */

const fs = require('fs').promises;
const path = require('path');

async function testIcons() {
  try {
    console.log('🧪 Testing PNG Events PWA icons...');
    
    const publicDir = path.join(__dirname, '../public');
    const iconsDir = path.join(publicDir, 'icons');
    
    // Test favicon.ico
    const faviconPath = path.join(publicDir, 'favicon.ico');
    const faviconExists = await fs.access(faviconPath).then(() => true).catch(() => false);
    console.log(`✅ Favicon.ico exists: ${faviconExists ? 'YES' : 'NO'}`);
    
    // Test PNG icons
    const requiredIcons = [
      'icon-72x72.png',
      'icon-96x96.png', 
      'icon-128x128.png',
      'icon-144x144.png',
      'icon-152x152.png',
      'icon-192x192.png',
      'icon-384x384.png',
      'icon-512x512.png',
      'icon-maskable-192x192.png',
      'icon-maskable-512x512.png'
    ];
    
    let allIconsExist = true;
    for (const icon of requiredIcons) {
      const iconPath = path.join(iconsDir, icon);
      const exists = await fs.access(iconPath).then(() => true).catch(() => false);
      console.log(`✅ ${icon}: ${exists ? 'EXISTS' : 'MISSING'}`);
      if (!exists) allIconsExist = false;
    }
    
    // Test manifest.json
    const manifestPath = path.join(publicDir, 'manifest.json');
    const manifestExists = await fs.access(manifestPath).then(() => true).catch(() => false);
    console.log(`✅ Manifest.json exists: ${manifestExists ? 'YES' : 'NO'}`);
    
    if (manifestExists) {
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      // Check if manifest has all required icons
      const manifestIcons = manifest.icons.map(icon => path.basename(icon.src));
      const missingInManifest = requiredIcons.filter(icon => !manifestIcons.includes(icon));
      
      if (missingInManifest.length === 0) {
        console.log('✅ All icons referenced in manifest.json');
      } else {
        console.log(`❌ Missing in manifest: ${missingInManifest.join(', ')}`);
        allIconsExist = false;
      }
    }
    
    // Summary
    console.log('\n📊 Test Results:');
    if (allIconsExist && faviconExists && manifestExists) {
      console.log('🎉 All PWA icons are properly configured!');
      console.log('\n📋 What was created:');
      console.log('   ✅ Favicon.ico for browser tabs');
      console.log('   ✅ PNG icons for PWA installation (72x72 to 512x512)');
      console.log('   ✅ Maskable icons for different device shapes');
      console.log('   ✅ Complete manifest.json configuration');
      console.log('\n🚀 Your PWA is ready for installation!');
      console.log('   - Visit http://localhost:3000 in your browser');
      console.log('   - The favicon should appear in the browser tab');
      console.log('   - Use "Add to Home Screen" or "Install" to test PWA installation');
    } else {
      console.log('❌ Some issues found with PWA icons');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error testing icons:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testIcons();
}

module.exports = { testIcons };