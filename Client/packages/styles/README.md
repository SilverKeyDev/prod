# Styles Package

CSS stylesheets and utility classes for the SilverKey application.

## Purpose

The `styles/` package contains CSS stylesheets that provide:
- Base styles and resets
- Component styles
- Utility classes
- Animations
- Mobile-specific styles
- Map styles

## Files

### `base.css`
Base styles, resets, and global styles.

### `components.css`
Component-specific styles.

### `utilities.css`
Utility classes for common patterns.

### `animations.css`
Animation definitions and keyframes.

### `mobile.css`
Mobile-specific styles and responsive utilities.

### `maps.css`
Google Maps-specific styles.

### `carousel.css`
Carousel component styles.

### `index.css`
Main stylesheet that imports all other stylesheets.

## Usage

Styles are imported in the main application entry point:

```typescript
// In main.tsx or App.tsx
import "../packages/styles/index.css";
```

## Organization

Styles are organized by concern:
- **Base** - Foundation styles
- **Components** - Component-specific styles
- **Utilities** - Reusable utility classes
- **Animations** - Animation definitions
- **Mobile** - Responsive styles
- **Maps** - Third-party integration styles

## Best Practices

1. **Use Tailwind where possible** - Prefer Tailwind classes over custom CSS
2. **Keep styles scoped** - Use component-specific classes
3. **Mobile-first** - Design for mobile, enhance for desktop
4. **Use CSS variables** - For theme values and colors
5. **Document complex styles** - Add comments for complex CSS

## Further Reading

- [packages/README.md](../README.md) - Packages overview
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
