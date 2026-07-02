---
name: Modern Enterprise Glassmorphism
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 24px
  unit-xl: 48px
---

## Brand & Style
The design system is engineered for "ReportSheet," an enterprise EdTech platform that balances academic rigor with high-end digital craftsmanship. The brand personality is sophisticated, authoritative, and intellectually premium. 

The visual style is **Modern Enterprise Glassmorphism**. It leverages the depth of translucent layers and backdrop filters to create a sense of lightness and speed. The interface avoids heavy, solid containers in favor of "floating" surfaces that imply a frictionless user experience. It utilizes expansive whitespace, high-contrast typography, and a refined color palette to evoke an emotional response of clarity and professional trust.

## Colors
The palette is centered around a sophisticated **Indigo** primary, symbolizing intelligence and stability. 

- **Light Mode:** Uses a "Pearl White" base. Surfaces are semi-transparent white (70% opacity) to allow background colors or subtle gradients to bleed through, creating the glass effect.
- **Dark Mode:** Replaces the base with "Midnight Slate." Surfaces remain translucent but shift to a deeper slate to maintain contrast and depth.
- **Accents:** Muted Emerald is reserved for success states and growth metrics, while Muted Slate handles non-interactive metadata.
- **Borders:** Subtle, high-transparency borders (white/40 in light mode) define edges without breaking the glass illusion.

## Typography
This design system utilizes **Plus Jakarta Sans** for its modern, clean, and slightly wider proportions which feel premium in enterprise settings. 

Headings use **ExtraBold (800)** or **Bold (700)** weights with **tight tracking** (negative letter spacing) to create a high-contrast, editorial look. Body text is set with generous line-height to ensure maximum readability during long reporting sessions. Labels and small UI metadata utilize medium weights with slightly increased tracking to maintain legibility at small scales.

## Layout & Spacing
The layout follows a **Fluid-Fixed Hybrid** model. Content is centered within a 1440px max-width container but uses fluid percentages for internal column structures.

- **Grid:** 12-column grid for desktop, 8-column for tablet, and 4-column for mobile.
- **Rhythm:** A strict 8px linear scale governs all padding and margins. 
- **Generosity:** This system prioritizes "breathability." Vertical spacing between sections should be aggressive (unit-xl) to emphasize the lightweight, expensive feel.
- **Mobile:** Margins shrink to 20px, and horizontal padding within cards is reduced to unit-md to maximize real estate for data tables and charts.

## Elevation & Depth
Depth is the core differentiator of this design system. It is achieved through a combination of three effects:

1.  **Backdrop Blur:** All interactive surfaces (cards, modals, navigation bars) must apply a `backdrop-filter: blur(24px)`.
2.  **Expansive Shadows:** Shadows are low-opacity but have a very large spread (e.g., `0 20px 50px -12px rgba(0,0,0,0.08)`). This simulates a light source that is far away, making elements feel like they are floating high above the base layer.
3.  **Tonal Stacking:** Higher elevation levels (like a popover over a modal) should increase in background opacity (from 70% to 85%) and border brightness to maintain visual hierarchy.

## Shapes
The shape language is defined by **High-Radius Geometry**. Standard UI components use a 24px radius (`rounded-xl` in this context) to soften the enterprise environment and make it feel more approachable and modern. Smaller elements like chips or buttons may use smaller radii, but the primary containers must remain heavily rounded to support the glassmorphic aesthetic.

## Components
- **Buttons:** Primary buttons use the Indigo HSL with a subtle inner glow. Secondary buttons are "Glass" style—transparent with a subtle border and blur.
- **Cards:** These are the hero components. They feature the 24px corner radius, `white/70` fill, `white/40` border, and the signature 2xl backdrop blur.
- **Input Fields:** Use a subtle inset shadow to appear slightly recessed into the glass surface. Focus states should trigger a primary color outer glow.
- **Chips/Badges:** Pill-shaped with low-contrast background tints (e.g., 10% opacity of the status color) and high-contrast text.
- **Data Tables:** Row separators are 1px semi-transparent lines. The table header should be pinned with a stronger backdrop blur to maintain context during scrolling.
- **Charts:** Use a custom-tuned palette of Indigo, Emerald, and Violet. Lines should be thick (3px+) with soft shadows to match the UI's depth.