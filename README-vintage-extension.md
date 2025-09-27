# Vintage History Landing Page Extension

This extension adds a professional vintage-themed landing page to the existing Ho Chi Minh journey website while preserving all original functionality.

## Features Added

- **Hero Section**: Vintage paper backdrop with animated Vietnamese flag
- **Timeline Section**: Interactive historical timeline with scroll animations
- **Gallery Section**: Masonry-style image gallery with sepia effects
- **Quote Section**: Decorative quote display with Vietnam flag colors
- **Call-to-Action**: Prominent CTA section linking to the interactive map
- **Footer**: Complete site navigation and information

## Technical Implementation

- **Namespace**: All new code uses `hist-` prefix to avoid conflicts
- **Performance**: Optimized animations with `requestAnimationFrame`
- **Accessibility**: WCAG 2.1 AA compliant with reduced motion support
- **Progressive Enhancement**: Works without JavaScript
- **Responsive Design**: Mobile-first approach with fluid typography

## Files Added

- `/assets/css/hist-landing.css` - Complete styling system
- `/assets/js/hist-landing.js` - Interactive features and animations
- `/assets/img/paper-texture.svg` - Subtle grain texture
- `/assets/img/vietnam-flag.svg` - Static flag fallback

## How to Disable/Revert

To disable the vintage landing page extension:

1. **Remove CSS**: Delete or comment out the `<link>` tag in `index.html`:
   ```html
   <!-- <link rel="stylesheet" href="/assets/css/hist-landing.css"> -->
   ```

2. **Remove JavaScript**: Delete or comment out the script tag:
   ```html
   <!-- <script defer src="/assets/js/hist-landing.js"></script> -->
   ```

3. **Remove HTML Content**: Delete the entire `<div class="hist-root">` section from `index.html`

4. **Clean Up Files**: Optionally delete the `/assets/` directory

## Customization

### Colors
Modify CSS variables in `:root` section of `hist-landing.css`:
```css
--hist-red: #DA251D;      /* Vietnam flag red */
--hist-brown: #4B2E21;    /* Primary brown */
--hist-yellow: #FFCD00;   /* Star yellow */
--hist-parchment: #F3E5C8; /* Background */
```

### Animation Speed
Adjust flag animation in `hist-landing.js`:
```javascript
flagAnimationSpeed: 0.02,  // Lower = slower
flagAmplitude: 8,          // Wave intensity
```

### Content
Update timeline items, gallery images, and text directly in the HTML sections within `index.html`.

## Browser Support

- Modern browsers with ES6+ support
- Graceful degradation for older browsers
- No JavaScript required for basic functionality
- Respects user accessibility preferences

## Performance Notes

- Total added assets: ~50KB (CSS + JS + SVG)
- Flag animation: ~30-45 FPS, pauses when tab hidden
- Images: Lazy-loaded and optimized
- Animations: Hardware-accelerated transforms only