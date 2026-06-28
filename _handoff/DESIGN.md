---
name: Aura Elegance
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#37393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d0c5b2'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#99907e'
  outline-variant: '#4d4637'
  surface-tint: '#e6c364'
  primary: '#e6c364'
  on-primary: '#3d2e00'
  primary-container: '#c9a84c'
  on-primary-container: '#503d00'
  inverse-primary: '#755b00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#c9c6c6'
  on-tertiary: '#313030'
  tertiary-container: '#adabab'
  on-tertiary-container: '#40403f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe08f'
  primary-fixed-dim: '#e6c364'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
  gold-hover: '#A67C2E'
  gold-light: '#E8D28A'
  surface-dark: '#242424'
  border-muted: '#2E2E2E'
  text-muted: '#9CA3AF'
typography:
  display-hero:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  nav-link:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 4rem
  section-gap: 5rem
---

## Brand & Style

This design system embodies the "Modern Luxury" aesthetic, specifically tailored for a premium e-commerce audience in the Syrian market. It bridges the gap between high-fashion editorial and functional retail. The visual personality is sophisticated, exclusive, and precise.

By blending **Minimalism** with **High-Contrast Boldness**, the design system focuses on large-scale imagery, generous white space, and a refined metallic palette. The interface acts as a silent gallery, allowing the products to take center stage while reinforcing the brand’s premium positioning through meticulous typography and gold accents.

Key characteristics:
- **Editorial Layouts:** High-impact headers and asymmetric product grids.
- **Bi-directional Symmetry:** A seamless transition between Arabic (RTL) and English (LTR) that preserves the hierarchy of luxury.
- **Tactile Accents:** Use of metallic gradients and thin, elegant borders to simulate high-end physical packaging.

## Colors

The palette is anchored by "Metallic Gold," representing prestige and quality. While the system supports both modes, the **Dark Mode** is the primary expression of the brand, evoking the interior of a luxury boutique.

- **Primary (Gold):** Reserved for call-to-actions, primary buttons, and critical highlights. It should be used sparingly to maintain its impact.
- **Secondary & Tertiary (Blacks):** Used for deep backgrounds and surface containers to create depth without relying on heavy shadows.
- **Neutral (White/Silver):** Primarily used for body text and high-contrast labels to ensure maximum legibility against dark backgrounds.
- **Functional Colors:** Error, Success, and Warning states are adjusted for high saturation to remain visible against dark surfaces, though they are often framed in gold to maintain brand consistency.

## Typography

The typography system relies on a high-contrast pairing: a traditional, sophisticated Serif for storytelling and a technical, modern Sans-Serif for utility.

- **Headlines:** Use Playfair Display. This font brings an editorial "Vogue-style" authority. For Arabic, use a high-contrast Naskh-style serif font that shares the same vertical weight distribution.
- **Body & UI:** Use Manrope. Its geometric yet humanist qualities ensure readability across dense product descriptions and technical specs. It scales beautifully from labels to long-form text.
- **Letter Spacing:** Apply expanded tracking (0.1em) to uppercase labels and navigation items to enhance the "premium" feel.
- **Hierarchy:** Maintain a strict ratio. Headlines should be significantly larger than body text to create a sense of dramatic scale.

## Layout & Spacing

This design system uses a **Fixed Grid** model for desktop to maintain the "framed" look of a luxury catalog, transitioning to a **Fluid Grid** for mobile.

- **The 12-Column Grid:** Desktop layouts follow a 12-column structure with generous 24px gutters. Product listings should span 3 or 4 columns (3-4 per row) to ensure product photography is large and immersive.
- **Logical Properties:** All spacing must use logical properties (e.g., `padding-inline-start`) to ensure that the layout mirrors perfectly when switching between Arabic and English.
- **Whitespace as a Feature:** Increase vertical padding between sections (80px - 120px) to prevent the store from feeling cluttered. Every product needs "room to breathe."
- **Breakpoints:**
    - Mobile: 0px - 767px (2-column product grid)
    - Tablet: 768px - 1023px (3-column product grid)
    - Desktop: 1024px+ (4-column product grid)

## Elevation & Depth

To maintain a minimalist luxury aesthetic, depth is created through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Tiers:** Use `#0F0F0F` for the base background and `#1A1A1A` or `#242424` for elevated containers like cards or modals.
- **Borders:** Use thin, 1px solid borders (`#2E2E2E`) to define sections. This creates a "blueprint" or "tailored" feel.
- **Ambient Shadows:** When shadows are necessary (e.g., for floating action buttons or sticky headers), use highly diffused, low-opacity shadows with a slight gold tint to suggest a warm light source.
- **Glassmorphism:** Apply a subtle backdrop blur (12px) to the navigation header and mobile bottom bars to maintain context while scrolling.

## Shapes

The shape language is "Soft-Professional." By using a minimal `0.25rem` (4px) radius, the UI maintains the structure and authority of sharp corners while feeling contemporary and polished.

- **Primary Elements:** Buttons and Input fields use the base `rounded-sm` (4px).
- **Secondary Elements:** Product cards and image containers can use slightly more rounded corners (`rounded-md`) to soften the visual weight of large images.
- **Interactive States:** Circular shapes are reserved exclusively for icon buttons (like 'Wishlist' or 'Search') and color swatches.

## Components

### Buttons
- **Primary:** Solid Gold (`#C9A84C`) with Black text. No border. High-gloss hover state using the `gold-hover` token.
- **Secondary:** Transparent background with a 1px Gold border. Text in Gold.
- **Tertiary:** Pure text buttons with the `label-caps` typography style and a 1px gold underline that appears on hover.

### Cards
- **Product Cards:** Full-bleed imagery with no visible border on the card itself. Information (Title, Price) is center-aligned below the image. Use a "Quick Add" button that appears only on hover (Desktop) or as a small gold icon (Mobile).

### Input Fields
- **Style:** Underline-only or thin-bordered styles are preferred. Labels must remain visible above the field at all times.
- **Validation:** Error states should use a thin red line, but the error message itself should be clean and aligned with the body-sm style.

### Navigation
- **Top Bar:** Center-aligned logo. Nav links in `label-caps` style. 
- **Mobile Tab Bar:** Icons for Home, Categories, Cart, and Account. The Cart icon should have a gold notification dot.
- **RTL Mirroring:** Navigation must flip horizontal order for Arabic, ensuring the logo and "Back" buttons are correctly positioned for RTL reading patterns.