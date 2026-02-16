# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

- `icon-192.png` - 192x192 pixel icon
- `icon-512.png` - 512x512 pixel icon

## Generating Icons

You can use the provided `icon.svg` as a source to generate PNG icons:

### Using ImageMagick (if available):
```bash
convert -density 192 -background none icon.svg icon-192.png
convert -density 512 -background none icon.svg icon-512.png
```

### Using Online Tools:
1. Visit https://realfavicongenerator.net/
2. Upload the `icon.svg` file
3. Configure your settings
4. Download the generated icons

### Design Guidelines

The icon should:
- Be simple and recognizable at small sizes
- Use the MaintenancePro brand colors (blue gradient)
- Include the wrench/maintenance symbol
- Be square with rounded corners for iOS compatibility

## Current Status

The manifest.json references these icon files. Until actual PNG files are created, 
browsers will use a default icon or generate one from the page content.

The provided icon.svg features:
- Blue gradient background (#1e3a8a to #3b82f6)
- White maintenance/settings gear symbol
- "MP" branding text
- Rounded corners for modern appearance
