#!/usr/bin/env node

/**
 * Create favicon.ico from PNG icons
 */

const fs = require('fs').promises;
const path = require('path');
const pngToIco = require('png-to-ico').default;

async function createFavicon() {
  try {
    console.log('🌟 Creating favicon.ico...');
    
    const baseIconPath = path.join(__dirname, '../public/icons/icon-192x192.png');
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    
    // Read the base icon
    const iconBuffer = await fs.readFile(baseIconPath);
    
    // Create favicon.ico with multiple sizes
    const faviconBuffer = await pngToIco([iconBuffer]);
    
    // Write the favicon.ico file
    await fs.writeFile(faviconPath, faviconBuffer);
    
    console.log('✅ Created favicon.ico successfully!');
    console.log(`📁 Favicon saved to: ${faviconPath}`);
    
  } catch (error) {
    console.error('❌ Error creating favicon:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createFavicon();
}

module.exports = { createFavicon };