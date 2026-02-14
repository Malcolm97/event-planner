#!/usr/bin/env node

/**
 * PNG Events Icon Generator
 * Creates all required PWA icons and favicon from the Emerald Digital logo
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Icon configuration
const CONFIG = {
  // Source logo image
  sourceLogo: path.join(__dirname, '../public/emerald-digital-black-logo.png'),
  sizes: {
    png: [72, 96, 128, 144, 152, 192, 384, 512],
    maskable: [192, 512],
    apple: [72, 76, 114, 120, 144, 152, 180],
    favicon: [16, 32, 48]
  },
  outputDir: path.join(__dirname, '../public/icons'),
  baseSize: 512
};

async function loadSourceLogo() {
  console.log('🎨 Loading Emerald Digital logo...');
  
  try {
    // Load the source logo image
    const logoBuffer = await fs.readFile(CONFIG.sourceLogo);
    return sharp(logoBuffer);
  } catch (error) {
    console.error('❌ Error loading source logo:', error.message);
    process.exit(1);
  }
}

async function generateIcons() {
  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    console.log('🚀 Starting PWA icon generation from Emerald Digital logo...');
    
    // Load source logo
    const sourceLogo = await loadSourceLogo();
    
    // Generate all PNG sizes for PWA
    console.log('🖼️  Generating PWA PNG icons...');
    for (const size of CONFIG.sizes.png) {
      const outputPath = path.join(CONFIG.outputDir, `icon-${size}x${size}.png`);
      await sourceLogo
        .clone()
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png({ quality: 90 })
        .toFile(outputPath);
      console.log(`✅ Created icon-${size}x${size}.png`);
    }
    
    // Generate Apple touch icons
    console.log('🍎 Generating Apple touch icons...');
    for (const size of CONFIG.sizes.apple) {
      const outputPath = path.join(CONFIG.outputDir, `apple-touch-icon-${size}x${size}.png`);
      await sourceLogo
        .clone()
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png({ quality: 90 })
        .toFile(outputPath);
      console.log(`✅ Created apple-touch-icon-${size}x${size}.png`);
    }
    
    // Create maskable icons (with transparency)
    console.log('🎭 Generating maskable icons...');
    for (const size of CONFIG.sizes.maskable) {
      const outputPath = path.join(CONFIG.outputDir, `icon-maskable-${size}x${size}.png`);
      await sourceLogo
        .clone()
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ quality: 90 })
        .toFile(outputPath);
      console.log(`✅ Created icon-maskable-${size}x${size}.png`);
    }
    
    // Generate favicon.png (32x32)
    console.log('🌟 Generating favicon...');
    const faviconPngPath = path.join(__dirname, '../public/favicon.png');
    await sourceLogo
      .clone()
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png({ quality: 90 })
      .toFile(faviconPngPath);
    console.log('✅ Created favicon.png (32x32)');
    
    // Also create favicon.ico from the 32x32 version
    const faviconIcoPath = path.join(__dirname, '../public/favicon.ico');
    await sourceLogo
      .clone()
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png({ quality: 90 })
      .toFile(faviconIcoPath);
    console.log('✅ Created favicon.ico');
    
    console.log('\n🎉 PWA icon generation complete!');
    console.log('\n📁 Generated files:');
    console.log('   - PNG icons: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512');
    console.log('   - Maskable icons: 192x192, 512x512');
    console.log('   - Favicon: favicon.png (32x32) and favicon.ico');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons, CONFIG };
