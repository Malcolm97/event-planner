# PNG Events Icon Generation Guide

This document explains how to generate and maintain the PWA icons for the PNG Events application.

## Overview

The PNG Events PWA includes a complete set of icons for:
- Browser favicon (favicon.ico)
- PWA installation icons (PNG format, multiple sizes)
- Maskable icons for different device shapes
- Apple touch icons and splash screens

## Icon Design

The icons feature:
- **Primary Color**: #FCD34D (Yellow/Amber from the theme)
- **Secondary Color**: #F59E0B (Orange from buttons)
- **Design Elements**: 
  - Calendar/event symbol
  - PNG cultural patterns (stylized bilum design)
  - "PNG EVENTS" text overlay
  - Circular gradient design

## Generated Files

### Favicon
- `public/favicon.ico` - Browser tab icon

### PNG Icons (for PWA)
- `public/icons/icon-72x72.png`
- `public/icons/icon-96x96.png`
- `public/icons/icon-128x128.png`
- `public/icons/icon-144x144.png`
- `public/icons/icon-152x152.png`
- `public/icons/icon-192x192.png`
- `public/icons/icon-384x384.png`
- `public/icons/icon-512x512.png`

### Maskable Icons (for PWA installation)
- `public/icons/icon-maskable-192x192.png`
- `public/icons/icon-maskable-512x512.png`

### Apple Touch Icons (existing)
- Various sizes in `public/icons/` for iOS devices

## How to Generate Icons

### Prerequisites
```bash
npm install sharp png-to-ico --save-dev
```

### Generate All Icons
```bash
node scripts/generate-icons.js
```

### Create Favicon.ico
```bash
node scripts/create-favicon.js
```

### Test Icon Configuration
```bash
node scripts/test-icons.js
```

## Development Workflow

1. **Initial Setup**: Run `npm install sharp png-to-ico --save-dev`
2. **Generate Icons**: Run `node scripts/generate-icons.js`
3. **Create Favicon**: Run `node scripts/create-favicon.js`
4. **Test Configuration**: Run `node scripts/test-icons.js`
5. **Start Development**: Run `npm run dev` and visit http://localhost:3000

## Testing PWA Installation

1. Start the development server: `npm run dev`
2. Visit http://localhost:3000 in your browser
3. Check that the favicon appears in the browser tab
4. Look for the "Install" or "Add to Home Screen" prompt
5. Test PWA installation on different devices

## Customization

To modify the icon design:

1. Edit the SVG templates in `scripts/generate-icons.js`
2. Update the color values in the `CONFIG` object
3. Regenerate icons using the scripts
4. Test the changes

## Dependencies

- `sharp` - Image processing library
- `png-to-ico` - PNG to ICO conversion
- `fs.promises` - File system operations
- `path` - Path utilities

## Notes

- The manifest.json is already configured to reference all generated icons
- Apple touch icons are preserved and not regenerated
- Icons are optimized for web use with appropriate quality settings
- The design maintains consistency with the PNG Events brand colors