#!/usr/bin/env node

/**
 * PNG Events Icon Generator
 * Creates all required PWA icons and favicon from a base design
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Icon configuration
const CONFIG = {
  colors: {
    primary: '#FCD34D',    // Your theme color
    secondary: '#F59E0B',  // Your button color
    background: '#FFFFFF',
    text: '#171717'
  },
  sizes: {
    png: [72, 96, 128, 144, 152, 192, 384, 512],
    maskable: [192, 512],
    favicon: [16, 32, 48]
  },
  outputDir: path.join(__dirname, '../public/icons'),
  baseSize: 512
};

async function createBaseIcon() {
  console.log('🎨 Creating base 512x512 PNG Events icon...');
  
  // Create SVG for the icon design
  const svg = `
    <svg width="${CONFIG.baseSize}" height="${CONFIG.baseSize}" viewBox="0 0 ${CONFIG.baseSize} ${CONFIG.baseSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${CONFIG.colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${CONFIG.colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Main circle with gradient -->
      <circle cx="${CONFIG.baseSize/2}" cy="${CONFIG.baseSize/2}" r="${CONFIG.baseSize/2 - 20}" fill="url(#grad)" />
      
      <!-- Event/calendar symbol in center -->
      <g transform="translate(${CONFIG.baseSize/2 - 60}, ${CONFIG.baseSize/2 - 70})">
        <!-- Calendar page -->
        <rect x="20" y="20" width="120" height="140" rx="12" fill="rgba(255,255,255,0.95)" />
        
        <!-- Calendar lines -->
        <line x1="20" y1="50" x2="140" y2="50" stroke="#F59E0B" stroke-width="3" />
        <line x1="20" y1="80" x2="140" y2="80" stroke="#F59E0B" stroke-width="2" />
        <line x1="20" y1="110" x2="140" y2="110" stroke="#F59E0B" stroke-width="2" />
        <line x1="20" y1="140" x2="140" y2="140" stroke="#F59E0B" stroke-width="2" />
        
        <!-- Date numbers -->
        <text x="45" y="70" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#F59E0B">25</text>
        <text x="85" y="70" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#F59E0B">DEC</text>
        
        <!-- Event dot -->
        <circle cx="100" cy="40" r="8" fill="#F59E0B" />
      </g>
      
      <!-- Decorative elements -->
      <g transform="translate(${CONFIG.baseSize/2}, ${CONFIG.baseSize/2})">
        <!-- Outer ring -->
        <circle r="${CONFIG.baseSize/2 - 40}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="4" />
        
        <!-- Inner ring -->
        <circle r="${CONFIG.baseSize/2 - 80}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
      </g>
      
      <!-- Text overlay -->
      <text x="${CONFIG.baseSize/2}" y="${CONFIG.baseSize - 30}" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
            fill="#171717" opacity="0.8">PNG EVENTS</text>
    </svg>
  `;

  // Create the icon from SVG
  return sharp(Buffer.from(svg))
    .png({ quality: 90 });
}

async function createMaskableIcon() {
  console.log('🎨 Creating maskable icon design...');
  
  // Create SVG for maskable icon (simpler design that works with masks)
  const svg = `
    <svg width="${CONFIG.baseSize}" height="${CONFIG.baseSize}" viewBox="0 0 ${CONFIG.baseSize} ${CONFIG.baseSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${CONFIG.colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${CONFIG.colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Main circular design that works well with masks -->
      <circle cx="${CONFIG.baseSize/2}" cy="${CONFIG.baseSize/2}" r="${CONFIG.baseSize/2 - 20}" fill="url(#grad)" />
      
      <!-- Event symbol in center -->
      <g transform="translate(${CONFIG.baseSize/2}, ${CONFIG.baseSize/2})">
        <!-- Calendar icon -->
        <rect x="-30" y="-40" width="60" height="80" rx="8" fill="rgba(255,255,255,0.95)" />
        
        <!-- Calendar lines -->
        <line x1="-25" y1="-10" x2="25" y2="-10" stroke="#F59E0B" stroke-width="3" />
        <line x1="-25" y1="10" x2="25" y2="10" stroke="#F59E0B" stroke-width="2" />
        <line x1="-25" y1="30" x2="25" y2="30" stroke="#F59E0B" stroke-width="2" />
        
        <!-- Date -->
        <text x="0" y="-25" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#F59E0B">25</text>
        <text x="0" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#F59E0B">DEC</text>
        
        <!-- Event dot -->
        <circle cx="20" cy="-30" r="6" fill="#F59E0B" />
      </g>
      
      <!-- Decorative border -->
      <circle cx="${CONFIG.baseSize/2}" cy="${CONFIG.baseSize/2}" r="${CONFIG.baseSize/2 - 10}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .png({ quality: 90 });
}

async function generateIcons() {
  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    console.log('🚀 Starting PNG Events icon generation...');
    
    // Create base icon
    const baseIcon = await createBaseIcon();
    
    // Generate all PNG sizes
    console.log('🖼️  Generating PNG icons...');
    for (const size of CONFIG.sizes.png) {
      const outputPath = path.join(CONFIG.outputDir, `icon-${size}x${size}.png`);
      await baseIcon
        .resize(size, size, { fit: 'cover' })
        .png({ quality: 90 })
        .toFile(outputPath);
      console.log(`✅ Created icon-${size}x${size}.png`);
    }
    
    // Create maskable icons
    console.log('🎭 Generating maskable icons...');
    const maskableIcon = await createMaskableIcon();
    for (const size of CONFIG.sizes.maskable) {
      const outputPath = path.join(CONFIG.outputDir, `icon-maskable-${size}x${size}.png`);
      await maskableIcon
        .resize(size, size, { fit: 'cover' })
        .png({ quality: 90 })
        .toFile(outputPath);
      console.log(`✅ Created icon-maskable-${size}x${size}.png`);
    }
    
    // Generate favicon.ico
    console.log('🌟 Generating favicon.ico...');
    const faviconOutputPath = path.join(__dirname, '../public/favicon.ico');
    
    // Create favicon from base icon
    const faviconBuffer = await baseIcon
      .resize(48, 48, { fit: 'cover' })
      .png({ quality: 90 })
      .toBuffer();
    
    // Convert PNG to ICO format using a simple approach
    // For now, we'll create a PNG favicon and note that a proper ICO converter would be better
    const faviconPngPath = path.join(__dirname, '../public/favicon.png');
    await baseIcon
      .resize(32, 32, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(faviconPngPath);
    
    console.log('✅ Created favicon.png (32x32)');
    
    // Copy one of the existing icons as favicon.ico for now
    // In a production environment, you'd use a proper ICO converter
    const sourceIcon = path.join(CONFIG.outputDir, 'icon-192x192.png');
    const faviconIcoPath = path.join(__dirname, '../public/favicon.ico');
    
    // For now, we'll create a simple favicon.ico using a different approach
    // Let's create a proper favicon using sharp's capabilities
    const faviconSharp = sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    });

    const faviconSvg = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${CONFIG.colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${CONFIG.colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#grad)" />
        <rect x="8" y="8" width="16" height="16" rx="3" fill="rgba(255,255,255,0.9)" />
        <line x1="8" y1="14" x2="24" y2="14" stroke="#F59E0B" stroke-width="2" />
        <text x="16" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#F59E0B">PNG</text>
      </svg>
    `;

    await faviconSharp
      .composite([{ input: Buffer.from(faviconSvg), blend: 'over' }])
      .png({ quality: 90 })
      .toFile(faviconIcoPath.replace('.ico', '.png'));
    
    console.log('✅ Created favicon.png (32x32) - simplified version');
    
    console.log('\n🎉 PNG Events icon generation complete!');
    console.log('\n📁 Generated files:');
    console.log('   - PNG icons: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512');
    console.log('   - Maskable icons: 192x192, 512x512');
    console.log('   - Favicon: favicon.png (32x32)');
    
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